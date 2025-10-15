// Imports for express
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

app.post("/stream-chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId)
      return res.status(400).json({ error: "Missing message or sessionId" });

    // Firebase History
    const snapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "asc")
      .get();

    const history = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { role: data.role, parts: [{ text: data.content }] };
    });

    // DEFAULT PROMPT SECTION
    history.unshift({
      role: "user",
      parts: [
        {
          text: "Responda em português brasileiro e use tom informal.",
          text: "Use no máximo 300 caracteres por resposta",
        },
      ],
    });

    // Chat History page
    const chat = model.startChat({
      history,
      generationConfig: { maxOutputTokens: 300 },
    });

    // Saves user messages
    await db.collection("messages").add({
      sessionId,
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    const result = await chat.sendMessageStream(message);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    let fullResponse = "";
    for await (const chunk of result.stream) {
      const text = await chunk.text();
      fullResponse += text;
      res.write(text);
    }
    res.end();

    // Saves model answer
    await db.collection("messages").add({
      sessionId,
      role: "model",
      content: fullResponse,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro no servidor" });
  }
});

app.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId)
      return res.status(400).json({ error: "sessionId é obrigatório" });

    const snapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "asc")
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      role: doc.data().role,
      content: doc.data().content,
      createdAt: doc.data().createdAt.toDate(),
    }));

    // Each user starts a new chat
    const conversations = [];
    let currentConvo = null;

    messages.forEach((msg) => {
      if (msg.role === "user") {
        if (currentConvo) conversations.push(currentConvo);
        currentConvo = {
          id: msg.id,
          title: msg.content.slice(0, 40), // title = chat name
          updatedAt: msg.createdAt,
        };
      } else if (currentConvo) {
        currentConvo.messages.push(msg);
        currentConvo.updatedAt = msg.createdAt;
      }
    });

    if (currentConvo) conversations.push(currentConvo);

    // Ordedr by the older to lastest
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);

    res.json({ history: conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro ao buscar histórico" });
  }
});

// Endpoint to serch for answers
app.get("/history-detail/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const doc = await db.collection("messages").doc(conversationId).get();
    if (!doc.exists)
      return res.status(404).json({ error: "Conversa não encontrada" });

    const data = doc.data();
    const sessionId = data?.sessionId;

    // Take all messages by the sessionId
    const snapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "asc")
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      role: doc.data().role,
      content: doc.data().content,
      createdAt: doc.data().createdAt.toDate(),
    }));

    res.json({ messages, title: data?.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar conversa detalhada." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend rodando em http://localhost:${PORT}`)
);
