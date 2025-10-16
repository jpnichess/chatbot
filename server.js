// Importa os módulos necessários
import express from "express"; // Framework para criar servidor HTTP e rotas
import cors from "cors"; // Permite requisições de outros domínios (CORS)
import dotenv from "dotenv"; // Lê variáveis de ambiente do arquivo .env
import admin from "firebase-admin"; // SDK Admin do Firebase (acesso ao Firestore)
import { GoogleGenerativeAI } from "@google/generative-ai"; // Biblioteca da API Gemini

// Carrega as variáveis de ambiente (.env)
dotenv.config();

// Inicializa o Firebase Admin com as credenciais
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Substitui os "\n" da chave privada por quebras de linha reais
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

// Inicializa o banco de dados Firestore
const db = admin.firestore();
// Ignora campos undefined ao salvar documentos
db.settings({ ignoreUndefinedProperties: true });

// Cria a aplicação Express
const app = express();
app.use(cors()); // Libera acesso CORS (necessário pro front se comunicar com o backend)
app.use(express.json()); // Faz o parse automático de JSON no corpo das requisições

// Inicializa o cliente da API Gemini com a chave de ambiente
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Define o modelo que será utilizado
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/* ============================================================
   ROTA: /stream-chat
   - Recebe uma mensagem e uma sessão
   - Envia para o modelo Gemini
   - Retorna a resposta via stream (texto em tempo real)
   ============================================================ */
app.post("/stream-chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validação simples
    if (!message || !sessionId)
      return res.status(400).json({ error: "Missing message or sessionId" });

    // Busca mensagens anteriores no Firestore para reconstruir o histórico
    const snapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .get();

    // Monta o histórico em formato aceito pelo modelo
    const history = snapshot.docs
      .map((doc) => ({
        role: doc.data().role, // "user" ou "model"
        parts: [{ text: doc.data().content }],
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }))
      .sort((a, b) => a.createdAt - b.createdAt) // Ordena por data
      .map(({ role, parts }) => ({ role, parts }));

    // Insere mensagens de contexto no início (define a “personalidade” do modelo)
    history.unshift({
      role: "user",
      parts: [
        { text: "Fale com tom português claro, informal e no máximo 500 caracteres." },
      ],
    });

    // Cria o chat com o histórico anterior
    const chat = model.startChat({
      history,
      generationConfig: { maxOutputTokens: 300 }, // Limite de tamanho da resposta
    });

    // Salva a nova mensagem do usuário no Firestore
    await db.collection("messages").add({
      sessionId,
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    // Envia a mensagem ao modelo e abre um stream de resposta
    const result = await chat.sendMessageStream(message);

    // Configura os headers da resposta HTTP para streaming de texto
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    let fullResponse = "";
    // Itera sobre o stream de resposta e envia os pedaços (chunks) ao cliente
    for await (const chunk of result.stream) {
      const text = await chunk.text();
      fullResponse += text;
      res.write(text); // Envia texto parcial em tempo real
    }
    res.end();

    // Salva a resposta completa do modelo no Firestore
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

/* ============================================================
   ROTA: /history/:sessionId
   - Retorna o histórico de conversas agrupado por sessão
   ============================================================ */
app.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId)
      return res.status(400).json({ error: "sessionId é obrigatório" });

    // Busca todas as mensagens da sessão no Firestore
    const snapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .get();

    // Mapeia e ordena as mensagens por data
    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        createdAt: doc.data().createdAt.toDate(),
      }))
      .sort((a, b) => a.createdAt - b.createdAt);

    // Agrupa mensagens por conversas (user → model)
    const conversations = [];
    let currentConvo = null;

    for (const msg of messages) {
      if (msg.role === "user") {
        // Inicia nova conversa quando o usuário envia mensagem
        if (currentConvo) conversations.push(currentConvo);
        currentConvo = {
          id: msg.id,
          title: msg.content.slice(0, 40), // Título é o início da mensagem
          updatedAt: msg.createdAt,
          messages: [msg],
        };
      } else if (currentConvo) {
        // Adiciona resposta do modelo à conversa atual
        currentConvo.messages.push(msg);
        currentConvo.updatedAt = msg.createdAt;
      }
    }

    if (currentConvo) conversations.push(currentConvo);

    // Ordena as conversas mais recentes primeiro
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);

    res.json({ history: conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro ao buscar histórico" });
  }
});

/* ============================================================
   ROTA: /history-detail/:conversationId
   - Retorna o detalhamento de uma conversa específica
   ============================================================ */
app.get("/history-detail/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Busca o documento pelo ID
    const doc = await db.collection("messages").doc(conversationId).get();

    if (!doc.exists)
      return res.status(404).json({ error: "Conversa não encontrada" });

    const data = doc.data();
    const sessionId = data?.sessionId;

    // Busca todas as mensagens da sessão correspondente
    const snapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .get();

    // Ordena por data
    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        createdAt: doc.data().createdAt.toDate(),
      }))
      .sort((a, b) => a.createdAt - b.createdAt);

    // Retorna o histórico completo e o título (conteúdo inicial)
    res.json({ messages, title: data?.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar conversa detalhada." });
  }
});

// Define a porta e inicia o servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend rodando em http://localhost:${PORT}`)
);
