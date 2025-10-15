# Journey for Mastery (JFM)

O **Journey for Mastery (JFM)** nasceu com um propósito claro: transformar a maneira como você estuda e assimila conhecimento. Sabemos que o excesso de conteúdo e a falta de organização podem ser grandes obstáculos na jornada do aprendizado. Pensando nisso, criamos uma plataforma inteligente que utiliza tecnologia e inteligência artificial para potencializar seu desenvolvimento.

---

## Visão Geral

O JFM é uma plataforma interativa que utiliza a API do **Google Gemini** para transformar materiais de estudo — como textos, PDFs ou anotações — em ferramentas personalizadas de aprendizagem, otimizando o processo de assimilação de conteúdo.

A proposta é simples, mas poderosa: você envia seu material, e a IA faz o resto.

---

## Funcionalidades Principais

- Leitura e compreensão automática de conteúdos (textos, PDFs e anotações);
- Geração de flashcards personalizados com perguntas e respostas para memorização ativa;
- Resumos inteligentes que destacam os pontos mais importantes do conteúdo;
- Listas de conceitos e definições essenciais para revisões rápidas;
- Simulados personalizados para testar o aprendizado de forma prática;
- Histórico de estudos com acompanhamento do progresso e organização dos materiais;
- Chat interativo com IA, capaz de guiar o raciocínio e tirar dúvidas com base no conteúdo estudado.

---

## Tecnologias Utilizadas

### Frontend

- React com TypeScript
- SCSS (estilização modular e responsiva)
- Firebase

### Backend

- Express.js (API REST)
- Integração com a API Google Gemini
- Firebase (opcional, para autenticação e armazenamento de dados)

---

## Instalação e Execução

# Instalação e Execução

1. Clonar o repositório
```bash

git clone https://github.com/jpnichess/chatbot-api.git
git clone https://github.com/jpnichess/jfm-front.git

3. Instalar dependências
Frontend:
```bash
cd jfm-front/
npm install
```


Backend:
```bash
cd chatbot-api/
npm install
```


3. Configurar variáveis de ambiente

Crie um arquivo .env no diretório chatbot-api com as seguintes chaves:

```bash
GEMINI_API_KEY=sua_chave_aqui
FIREBASE_API_KEY=sua_chave_aqui
PORT=5000

4. Executar o projeto
# Backend:
```bash
cd chatbot-api/
cd chatbot-api/ 
node server.js

# Frontend:
```bash
cd jfm-front
npm run dev
# chatbot
# chatbot
# chatbot
