Backend para o chatbot construído para fornecer respostas em streaming usando a API Gemini (Google). Este serviço serve como intermediário entre a interface web (frontend) e a inteligência artificial, permitindo gerenciamento de sessões e histórico de conversas.

🚀 Tecnologias

Node.js

Express.js — framework para criação de APIs

Firebase Admin — autenticação e armazenamento

Axios — para chamadas HTTP externas

CORS — gerenciamento de requisições cross-origin

dotenv — gerenciamento de variáveis de ambiente

📦 Instalação
Clonar o repositório
git clone https://github.com/jpnichess/Backend-gpt.git
cd Backend-gpt

Instalar dependências
npm install

Configurar variáveis de ambiente

Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL=YOUR_FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY=YOUR_FIREBASE_PRIVATE_KEY
PORT=5000
GOOGLE_API_KEY=YOUR_GOOGLE_GENERATIVE_AI_KEY


Nota: Certifique-se de que FIREBASE_PRIVATE_KEY mantenha as quebras de linha corretas (\n) ou utilize replace(/\\n/g, '\n') no código para corrigir.

Rodar o servidor
npm run dev


O servidor irá rodar na porta configurada (PORT) e estará pronto para receber requisições do frontend.

🌐 Endpoints

O backend disponibiliza os seguintes endpoints para integração com o frontend:

POST /stream-chat

Envia uma mensagem do usuário e recebe a resposta da IA em streaming.

Body:

{
  "userId": "string",
  "sessionId": "string",
  "message": "string"
}


Resposta: Stream da IA em tempo real.

GET /history/:sessionId

Retorna o histórico de interações de uma sessão agrupadas por conversa.

Parâmetros:

sessionId — ID da sessão do usuário

Resposta:

[
  {
    "conversationId": "string",
    "createdAt": "timestamp",
    "messages": [...]
  }
]

GET /history-detail/:conversationId

Retorna detalhes de uma conversa específica.

Parâmetros:

conversationId — ID da conversa

Resposta:

{
  "conversationId": "string",
  "createdAt": "timestamp",
  "messages": [
    {
      "sender": "user|ai",
      "message": "string",
      "timestamp": "string"
    }
  ]
}

⚡ Fluxo de integração

O frontend envia mensagens via POST /stream-chat.

O backend processa a mensagem usando a API Gemini do Google.

As respostas são retornadas em streaming para o usuário.

Todas as interações são armazenadas no Firebase para histórico.

O frontend pode consultar o histórico completo ou detalhes específicos das conversas usando GET /history/:sessionId e GET /history-detail/:conversationId.
