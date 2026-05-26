import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`check_groq_config_${ip}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const hasKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "";
  
  if (!hasKey) {
    throw new AppError("Groq API key is not configured", 500);
  }
  
  return NextResponse.json({ hasKey }, { status: 200 });
});