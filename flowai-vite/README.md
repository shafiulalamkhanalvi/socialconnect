# FlowAI Frontend (Vite)

Vite + React + TypeScript rebuild of the FlowAI frontend. Talks to the existing
FlowAI backend (Express/Prisma/BullMQ) over its REST API — no backend changes needed.

## Local setup

```bash
cp .env.example .env
# edit .env -> VITE_API_URL=http://localhost:4000 (or your deployed backend URL)
npm install
npm run dev        # -> http://localhost:3000
```

## Build

```bash
npm run build       # outputs to dist/
npm run preview     # serve the production build locally
```

## Deploy to Vercel

1. Import this repo/folder into Vercel.
2. Framework Preset: **Vite** (should auto-detect from package.json).
3. Root Directory: point at this folder if it's nested in a monorepo.
4. Environment Variables: add `VITE_API_URL` = your backend's public URL
   (Railway/Render/Fly), no trailing slash.
5. Deploy. `vercel.json` already includes the SPA rewrite rule so client-side
   routes like `/dashboard` and `/workflow/:id` work on direct load/refresh.

## Structure

```
src/
  pages/            Home, Login, Register, Dashboard, Credentials, WorkflowEditor
  components/       NodeConfigPanel, nodes/GenericNode
  lib/api.ts        Thin fetch wrapper + typed API calls (JWT in localStorage)
  index.css         Global design tokens (dark theme, same palette as before)
```

Routing uses `react-router-dom` (`BrowserRouter`) instead of Next.js's file-based
router. All page components and behavior are otherwise a 1:1 port.
