import { Redis } from '@upstash/redis';

// ============================================================================
// ⚙️ CONFIGURATION CONSTANTS (Updated for Issue #3256)
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 50;     // Upgraded to 50 per issue specs

// ============================================================================
// 🔌 REDIS INITIALIZATION
// ============================================================================
let redisClient = null;
try {
  // Automatically picks up UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  redisClient = Redis.fromEnv();
} catch (envError) {
  console.warn('[rate-limit] Upstash Redis environment variables missing. Circuit breaker will default to memory fallback.');
}

// ============================================================================
// 🛟 CIRCUIT BREAKER: ADVANCED IN-MEMORY FALLBACK
// ============================================================================
// Used if Redis goes down, ensuring the API never crashes.
const fallbackRateLimitMap = new Map();
let lastCleanupTime = Date.now();
const MAP_CLEANUP_INTERVAL_MS = 60 * 1000;

/**
 * Fallback sliding-window rate limiter using local server memory.
 * @param {string} userId - The user or IP identifier
 * @returns {Object} { allowed: boolean, remaining: number }
 */
function checkRateLimitFallback(userId) {
  const now = Date.now();

  // Periodically clean up the entire map to prevent memory leaks from inactive users
  if (now - lastCleanupTime > MAP_CLEANUP_INTERVAL_MS) {
    for (const [key, timestamps] of fallbackRateLimitMap.entries()) {
      const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        fallbackRateLimitMap.delete(key);
      } else if (active.length !== timestamps.length) {
        fallbackRateLimitMap.set(key, active);
      }
    }
    lastCleanupTime = now;
  }

  if (!fallbackRateLimitMap.has(userId)) {
    fallbackRateLimitMap.set(userId, [now]);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  const timestamps = fallbackRateLimitMap.get(userId);
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length === 0) {
    fallbackRateLimitMap.set(userId, [now]);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    fallbackRateLimitMap.set(userId, validTimestamps);
    return { allowed: false, remaining: 0 };
  }

  validTimestamps.push(now);
  fallbackRateLimitMap.set(userId, validTimestamps);
  
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length 
  };
}

// ============================================================================
// 🚀 CORE REDIS SLIDING-WINDOW ENGINE
// ============================================================================
/**
 * Main Rate Limiter Function exported to the rest of the application.
 * Replaces the old MongoDB logic with a high-performance Redis Pipeline.
 * * @param {string} userId - The unique identifier for the requester.
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
export async function checkRateLimit(userId) {
  const now = Date.now();

  // 1. If Redis client failed to initialize, immediately use Circuit Breaker
  if (!redisClient) {
    return checkRateLimitFallback(userId);
  }

  try {
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const redisKey = `rate_limit:user:${userId}`;

    // 2. Execute Atomic Redis Pipeline
    // This executes all 4 commands in a single network round-trip for massive speed
    const pipeline = redisClient.pipeline();
    
    // Remove timestamps older than our 60-second window
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count how many requests are currently in the valid window
    pipeline.zcard(redisKey);
    
    // Add the current request. We use a unique member ID (timestamp + random string)
    // to ensure exact-same-millisecond requests aren't overwritten.
    const uniqueMemberId = `${now}_${Math.random().toString(36).substring(2, 8)}`;
    pipeline.zadd(redisKey, { score: now, member: uniqueMemberId });
    
    // Set the key to expire so we don't leak memory in Redis
    pipeline.pexpire(redisKey, RATE_LIMIT_WINDOW_MS);

    // Await the pipeline execution
    const results = await pipeline.exec();
    
    // 3. Evaluate the results
    // Pipeline returns an array of results matching the order of commands.
    // Index 1 corresponds to the `zcard` (count) command.
    const currentRequestCount = results[1];

    // If the count BEFORE adding this request is >= the limit, block them.
    if (currentRequestCount >= MAX_REQUESTS_PER_WINDOW) {
      // Clean up the request we just added since it was rejected
      await redisClient.zrem(redisKey, uniqueMemberId);
      
      return { 
        allowed: false, 
        remaining: 0 
      };
    }

    // 4. Success! Allow the request
    return {
      allowed: true,
      remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - currentRequestCount - 1),
    };

  } catch (err) {
    // 5. Circuit Breaker Triggered
    // If Upstash Redis times out or throws an error, we catch it here, log it,
    // and instantly route the user through the local memory fallback so the API stays up.
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(
      "[rate-limit] Redis unavailable, tripping Circuit Breaker to in-memory fallback:",
      errMsg
    );
    
    return checkRateLimitFallback(userId);
  }
}

// ============================================================================
// 🛡️ EXPRESS / NEXT.JS MIDDLEWARE EXPORT
// ============================================================================
/**
 * Optional Wrapper for easy injection into standard API routes.
 */
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    const identifier = req.user?.id || req.headers['x-forwarded-for'] || 'anonymous';
    const result = await checkRateLimit(identifier);

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      });
    }

    next();
  } catch (error) {
    console.error('[RateLimiter Middleware Error]', error);
    // Fail open: let the request through if the entire limiter crashes
    next();
  }
};