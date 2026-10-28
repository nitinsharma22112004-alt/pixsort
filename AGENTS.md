# Agent Guidelines & Development Standards

This document preserves persistent coding standards, scope boundaries, and design guidelines for PixSort.

## 1. Core Intent & Scope Discipline
- Build strictly what the user requests: clean personal photo management with natural language semantic search.
- Never add unsolicited third-party SDKs, mock external social features, or unsolicited complex multi-tab layouts.
- Prefer deletion and simplification over adding unnecessary code.

## 2. Google Ecosystem Utilization
- **Vision & Embeddings**: Always use `@google/genai` TypeScript SDK (`gemini-2.5-flash` for multimodal vision analysis and `gemini-embedding-2-preview` for **3072-dimensional** dense vector embeddings).
- **Vector Search**: Use local in-memory cosine similarity matching ($\cos\theta = A \cdot B$) following Vertex AI Vector Search principles for sub-3ms, $0 query cost search.
- **Decentralized Storage**: Use Google Drive REST API v3 streaming (`files.get?alt=media`) pooled across personal Google accounts with capacity failover, priority reordering, safe disconnect, and storage deletion controls.
- **Persistence & Security**: Use Google Cloud Firestore (`pixsort-62b7b`) as the source of truth for photo and album records, protected by per-user security rules (`request.auth.uid == resource.data.userId`).
- **Authentication**: Firebase Dual-Mode Authentication (Google 1-click popup with `drive.file` scope + Email/Password) with `x-user-id` header request isolation.

## 3. UI & Styling Architecture
- **Palette**: Neutral soft clay `#EEF2F6` with subtle raised (`.neo-raised`) and inset (`.neo-inset`) neomorphic shadows.
- **Button Styling**: Always ensure high text contrast. Primary action buttons should use `.neo-btn-primary` or vibrant solid background classes (`bg-blue-600 text-white`) to prevent white text on light grey background conflicts.
- **Sidebar**: Floating, sticky layout docked via `sticky top-4 self-start` with internal scrolling (`max-h-[calc(100vh-5.5rem)] overflow-y-auto`).
- **Icons**: Always import icons from `lucide-react`.
- **Motion**: Use `motion` for layout and modal transitions.
- **Landing Page & Deck**: Unauthenticated users see the Landing Page with the Live Interactive AI Simulator; the Capstone Defense Deck is accessible at `/presentation` or `#presentation`.

## 4. Full-Stack Conventions
- Dev command: `tsx server.ts` (or `npm run dev`)
- Build command: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
- Always bind Express to `0.0.0.0` and port `3000`.
