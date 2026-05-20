import { POST } from "@/app/api/conversations/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
        headers: new Map(),
      };
    }),
  },
}));

jest.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: jest.fn(),
}));

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

describe("POST /api/conversations - Authentication Security Tests", () => {
  let mockInsertOne;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInsertOne = jest.fn();

    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        insertOne: mockInsertOne,
      }),
    });
  });

  const createMockRequest = (headers, bodyData) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: jest.fn().mockResolvedValue(bodyData),
    };
  };

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({}, {
      userMessage: "Hello",
      botMessage: "Hi there!",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockInsertOne).not.toHaveBeenCalled();
    expect(connectDb).not.toHaveBeenCalled(); // No DB operations on auth failure
  });

  test("rejects request with invalid token with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest(
      { authorization: "Bearer invalid-token" },
      {
        userMessage: "Hello",
        botMessage: "Hi there!",
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(verifyFirebaseToken).toHaveBeenCalledWith("invalid-token");
    expect(mockInsertOne).not.toHaveBeenCalled();
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("accepts request with valid token, inserts conversation with userId/userEmail", async () => {
    const mockDecodedToken = {
      uid: "user-123",
      email: "user@example.com",
    };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);
    mockInsertOne.mockResolvedValue({ insertedId: "conv-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        userMessage: "Hello",
        botMessage: "Hi there!",
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe("user-123");
    expect(body.data.userEmail).toBe("user@example.com");
    expect(body.data.userMessage).toBe("Hello");
    expect(body.data.botMessage).toBe("Hi there!");
    expect(verifyFirebaseToken).toHaveBeenCalledWith("valid-token");
    expect(mockInsertOne).toHaveBeenCalled();
    expect(connectDb).toHaveBeenCalled();
  });
});
