import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function POST(req) {
  try {
    const authorization = req.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    const { userMessage, botMessage } = await req.json();

    const db = await connectDb();
    const collection = db.collection("conversations");

    const newConversation = {
      userId: decodedToken.uid,
      userEmail: decodedToken.email,
      userMessage,
      botMessage,
      timestamp: new Date(),
    };

    await collection.insertOne(newConversation);

    return jsonSuccess(newConversation);
  } catch (err) {
    console.error("Save Message Error:", err);
    return jsonError(err.message || "Failed to save conversation", 500);
  }
}
