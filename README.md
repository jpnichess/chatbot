# 🤖 Chatbot — Backend

Backend para o chatbot construído para fornecer respostas em **streaming** usando a **API Gemini (Google)**.  
Este serviço serve como intermediário entre a interface web (frontend) e a inteligência artificial, permitindo **gerenciamento de sessões** e **histórico de conversas**.

---

## 🚀 Tecnologias

- **Node.js**  
- **Express.js** — framework para criação de APIs  
- **Firebase Admin** — autenticação e armazenamento  
- **Axios** — para chamadas HTTP externas  
- **CORS** — gerenciamento de requisições cross-origin  
- **dotenv** — gerenciamento de variáveis de ambiente  

---

## 📦 Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/jpnichess/Backend-gpt.git
cd Backend-gpt

### 2. Instalar dependências
npm install

### 3. Configuração de variáveis de ambiente

### 🌐 Integração com o Backend

#Endpoints consumidos pelo frontend:

POST /stream-chat → envia mensagem e recebe resposta da IA via streaming

GET /history/:sessionId → retorna histórico de interações agrupadas

GET /history-detail/:conversationId → detalhes de uma conversa específica
