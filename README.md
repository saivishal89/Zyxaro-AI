# ZYXARO AI (Zaraki AI Stack)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Private, Local-First Multi-Model AI Research & Orchestration Platform**  
*Connect directly to 18+ frontier AI models in parallel, ground with in-browser RAG, and orchestrate with LCM concept planning.*

</div>

---

## ⚡ Overview

ZYXARO AI is a local-first, zero-backend AI research assistant built with React and Vite. It connects directly from your browser to 18+ AI providers simultaneously, performing multi-model comparison, local document RAG (Retrieval-Augmented Generation), live code execution, and automated report generation—with 100% data sovereignty and zero server tracking.

### Core Capabilities
- **Parallel Multi-Model Concurrency:** Connect directly to 18+ AI providers in parallel (`Promise.allSettled`) including OpenAI, Anthropic, DeepSeek, Groq, Mistral, Gemini, Cohere, Perplexity, and Featherless.
- **100% Local-First Privacy:** API keys, conversations, and document chunks are persisted in browser `localStorage`.
- **In-Browser RAG Engine:** Upload text, markdown, or code documents for client-side TF-IDF vectorization and cosine similarity retrieval.
- **Interactive Code Sandbox:** Live code preview and testing with Sandpack.
- **Rich Export Formats:** Export findings and chats directly to PowerPoint (.pptx), Word (.doc), Markdown, or JSON.
- **Interactive UI Effects:** FloatingLines WebGL shader canvas, StarBorder, Stepper, and glassmorphic HUD controls.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local development server on port 3000
npm run dev

# Build for production
npm run build
```
