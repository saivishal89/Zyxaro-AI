# ZARAKI AI STACK

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-Workspaces-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

**An Elite, Local-First Multi-Model AI Research & Orchestration Platform**  
*Connect directly to 18+ frontier AI models in parallel, ground with in-browser RAG, and orchestrate with LCM concept planning.*

[Quick Start](#-quick-start) • [Architecture](#-dual-mode-architecture) • [Features](#-core-capabilities) • [Supported Providers](#-supported-ai-providers) • [Security & Privacy](#-security--privacy-architecture) • [Pitch Deck](PRESENTATION.md)

</div>

---

## ⚡ 10-Second Overview

Zaraki AI (formerly Zyxaro AI Stack) is built for researchers, software engineers, and privacy-conscious analysts. It operates in **two flexible modes**:

1. **Client-First Mode (Zero Backend):** Connect directly from your browser to 18+ AI providers in parallel (`Promise.allSettled`). Your API keys, chat histories, and notes stay strictly in your browser's `localStorage`—no account, zero server tracking, zero subscription markup.
2. **Full-Stack Mode (Advanced Engine):** An optional high-performance Python FastAPI backend (`backend/main.py`) providing **Large Concept Model (LCM)** planning, hybrid RAG document grounding, answer verification, and an authenticated API key gateway (`zk_live_*`).

---

## 🏗 Dual-Mode Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ZARAKI AI ARCHITECTURE                          │
├──────────────────────────────────┬─────────────────────────────────────┤
│   MODE 1: CLIENT-FIRST (Direct)  │   MODE 2: ORCHESTRATOR (Full-Stack) │
│   • 100% In-Browser Execution    │   • Python FastAPI Backend (:3001)  │
│   • Direct HTTPS to 18+ LLMs     │   • LCM Concept Planning Layer      │
│   • LocalStorage Persistence     │   • Hybrid RAG Chunking & Retrieval │
│   • Sub-500ms Direct Connection  │   • Verification & Hallucination Gate│
│   • Client-side PPTX/DOC Export  │   • Developer API Keys (zk_live_*)  │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### Request Flow
```
User Prompt ──┬──> [Client-First] ───⚡ Direct HTTPS ───> 18+ LLM Endpoints (Parallel)
              │
              └──> [Orchestrator] ───> LCM Planning ───> RAG Retrieval ───> LLM Gateway ───> Output Verification
```

---

## ✨ Core Capabilities

* **⚡ 18+ Direct AI Providers:** Stream responses simultaneously from OpenAI, Anthropic, DeepSeek, Groq, Gemini, Mistral, Ollama (Local), and Custom Endpoints.
* **🧠 Parallel Benchmarking:** Fire a single query across multiple models to eliminate hallucinations and compare reasoning side-by-side.
* **📑 In-Browser Local RAG:** Drag-and-drop `.pdf`, `.md`, `.txt`, and `.json` documents. Processed and chunked entirely in-memory with zero external cloud upload.
* **💻 Live Code Sandbox:** Execute and preview generated HTML, React/JSX, Tailwind CSS, and JavaScript in real-time with inline console debugging.
* **📊 1-Click Research Export Suite:** Export formatted research sessions directly to PowerPoint (`.pptx` via `pptxgenjs`), Word (`.doc`), PDF, and Markdown.
* **🎨 Cyberpunk Aesthetic:** Dark navy theme (`#03081A`), dynamic HTML5 Canvas particle/starfield backdrop, Orbitron & Exo 2 typography.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js** >= 20.x & **pnpm** >= 9.x
* **Python** >= 3.11 (optional, for full-stack orchestrator)

### 1. Run the Frontend (Client-First Mode)
```bash
# Clone the repository
git clone https://github.com/saivishal89/Zyxaro-AI.git
cd Zyxaro-AI

# Install dependencies across all workspace packages
pnpm install

# Start the frontend dev server
pnpm --filter @workspace/zaraki-ai run dev
```
Open **`http://localhost:5000`** in your browser.  
Click **⚙ Config** (top right) to toggle your preferred AI providers and enter your API keys.

### 2. Run the Zaraki Backend (Optional Full-Stack Mode)
```bash
# In a separate terminal, navigate to backend and activate virtualenv
cd backend
python -m venv .venv
.\.venv\Scripts\activate       # On Windows PowerShell
# source .venv/bin/activate    # On Linux/macOS

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI Orchestrator (port 3001)
python -m uvicorn backend.main:app --port 3001 --host 0.0.0.0
```
Backend health check: **`http://localhost:3001/api/ai/health`**

---

## 🤖 Supported AI Providers

| Provider | Default Model | Connection Method | Free Tier Available |
| :--- | :--- | :--- | :---: |
| **Groq** | `llama-3.3-70b-versatile` | Direct HTTPS | ✅ Yes |
| **Google Gemini** | `gemini-2.5-flash` | Direct HTTPS | ✅ Yes |
| **DeepSeek** | `deepseek-chat` | Direct HTTPS | ✅ Yes (Low-cost) |
| **OpenRouter** | `google/gemini-2.5-flash` | Direct HTTPS | ✅ Yes |
| **Ollama** | Custom local models | `http://localhost:11434` | ✅ 100% Free / Offline |
| **Anthropic** | `claude-sonnet-4-20250514` | Native `/v1/messages` | 💳 Pay-per-use |
| **OpenAI** | `gpt-4o` | Direct HTTPS | 💳 Pay-per-use |
| **Mistral** | `mistral-large-latest` | Direct HTTPS | ✅ Free tier |
| **Together AI** | `Llama-3.3-70B-Instruct` | Direct HTTPS | ✅ Free credits |
| **Featherless** | `Qwen2.5-72B-Instruct` | Direct HTTPS | ✅ Free tier |
| **Perplexity** | `sonar` | Direct HTTPS | 💳 Pay-per-use |
| **Custom Endpoint** | User defined | OpenAI-compatible endpoint | Depends on server |

---

## 🔒 Security & Privacy Architecture

We take data sovereignty seriously:

1. **Client-Side Key Storage:** In Client-First mode, API keys reside strictly inside your browser's `localStorage`. They are never transmitted to any Zaraki server.
2. **CORS & Edge Proxying:**
   - Standard CORS-enabled endpoints (Groq, OpenRouter, OpenAI, Gemini) communicate directly from the browser.
   - For endpoints or environments restricting browser CORS, requests can route through the built-in edge bridge (`/api/fetch-url`) or local backend gateway.
3. **Instant 1-Click Nuclear Purge:** The UI includes an instant data reset button ("Burn All Data") that wipes all cached chats, notes, and stored API keys from `localStorage`.
4. **Developer Keys (`zk_live_*`):** When using the Python backend gateway, keys are cryptographically hashed using SHA-256 before storage in SQLite (`backend/zaraki.db`).

---

## 📁 Repository Structure

```
├── artifacts/
│   ├── zaraki-ai/          # Core React 18 + Vite frontend application
│   │   ├── src/
│   │   │   ├── components/ # UI components (ChatArea, ConfigPanel, RagDrawer, etc.)
│   │   │   ├── lib/        # Provider adapters, export engines, RAG engine
│   │   │   └── pages/      # Home, 404 views
│   │   └── vite.config.ts  # Vite configuration with local API server bridge
│   └── mockup-sandbox/     # UI Component preview & sandbox tool
├── backend/                # Python FastAPI Orchestration Engine
│   ├── main.py             # FastAPI entrypoint & router mounts
│   ├── gateway.py          # Provider adapters & router
│   ├── database.py         # SQLite key store & session persistence
│   ├── orchestrator/       # LCM planning, RAG pipeline, & answer verifier
│   └── tests/              # Backend test suite (pytest)
├── api/                    # Serverless Edge handlers (fetch-url, mcp)
├── lib/                    # Shared workspace libraries (db, api-spec, api-zod)
├── PRESENTATION.md         # Full 12-slide presentation pitch deck
├── PRD.md                  # Comprehensive Product Requirements Document
└── LICENSE                 # MIT License
```

---

## 🏷️ Brand & Naming Convention

* **Official Product Name:** **Zaraki AI** (formerly Zyxaro AI / Zyxaro Stack).
* **LocalStorage Keys:** For backward compatibility and seamless updates, both `zrk_*` and legacy `zyx_*` key prefixes are supported.

---

## 🛠 Workspace Scripts

```bash
# Typecheck all packages
pnpm run typecheck

# Build all packages for production
pnpm run build

# Run backend unit tests
cd backend && pytest tests/
```

---

## 📄 License & Author

Created & Maintained by **Chikoti Sai Vishal**.  
Licensed under the [MIT License](LICENSE).
