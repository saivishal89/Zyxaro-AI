# ZYXARO AI STACK

A private, local-first AI research assistant that connects directly from the browser to any OpenAI-compatible API. All data (keys, sessions, notes) stays in localStorage — no backend, no account required.

Created & Maintained with **Antigravity** (Google DeepMind).

## Run & Operate

- `pnpm --filter @workspace/zaraki-ai run dev` — run the frontend (served at `http://localhost:5000`)
- `pnpm run typecheck` — full typecheck across all workspace packages
- `pnpm run build` — build all workspace packages for production

## Stack

- **Workspace Manager**: `pnpm` workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React 18 + Vite (`artifacts/zaraki-ai`)
- **Styling**: TailwindCSS 4, Lucide Icons, Shadcn UI
- **Storage**: 100% `localStorage` — no backend server or database required
- **Typography**: Orbitron (headings), Exo 2 (body) via Google Fonts
- **Visuals & Canvas**: HTML5 Canvas starfield background, dynamic UI components
- **Export Formats**: Presentation slides (`pptxgenjs`), PDF, DOCX, Markdown

## Project Structure

- `artifacts/zaraki-ai/src/` — Complete frontend application source code
- `artifacts/zaraki-ai/src/index.css` — Modern design system (dark navy palette, `#03081A` bg, `#60A5FA` accent)
- `artifacts/mockup-sandbox/` — UI Component preview & sandbox tool

## Architecture & Design Decisions

- **Local-First & Zero Backend**: All AI model calls execute directly from the browser to provider API endpoints. CORS headers are handled by providers.
- **Unified Provider Integration**: 18 supported AI providers using the OpenAI Chat Completions standard; Anthropic natively supported via its messages endpoint.
- **Multi-Provider Parallelism**: Promise.all fires all active provider queries simultaneously and renders streaming outputs in parallel.
- **Google Fonts Import Order**: `@import` for Google Fonts is defined at line 1 in `index.css` before `@import 'tailwindcss'` to prevent PostCSS parsing warnings.

## Product Capabilities

ZYXARO AI enables users to chat with up to 18 AI providers simultaneously, generate images with `/image`, manage research notes, maintain session history, export formatted reports as PPT/DOC/PDF, and utilize voice input — all with total privacy.

## LocalStorage Key Manifest

- `zyx_sessions` / `zrk_sessions` — All chat sessions & message histories
- `zyx_notes` / `zrk_notes` — Saved user notes and excerpts
- `zyx_provs` / `zrk_provs` — Array of active provider IDs
- `zyx_k_<id>` / `zrk_k_<id>` — Encrypted/stored API key per provider
- `zyx_custep` / `zyx_custmod` — Custom provider endpoint URL & model name

## Development Gotchas

- Google Fonts `@import url(...)` MUST appear BEFORE `@import 'tailwindcss'` in `index.css`.
- Anthropic API uses the `x-api-key` header and `/v1/messages` endpoint (not `/v1/chat/completions`).
- The app operates client-side only; no backend server required.
