# Tic Tac Toe

A minimal, fast, and deploy-friendly Tic Tac Toe game.

## Stack
- Next.js 14 (App Router) + TypeScript
- React 18
- Tailwind CSS
- `output: "standalone"` for Docker / edge runtimes

## Develop
```bash
npm install
npm run dev
```

## Build & run
```bash
npm run build
npm run start
```

## Deploy
- **Vercel**: `vercel` (zero config)
- **Netlify**: `netlify deploy --prod`
- **Docker**:
  ```bash
  docker build -t tic-tac-toe .
  docker run -p 3000:3000 tic-tac-toe
  ```

## Scale
- Static-rendered, no backend required.
- Game state lives in `localStorage` (offline-first, zero infra).
- To add online multiplayer later, drop in a real-time backend (e.g. Supabase Realtime, PartyKit, or a WebSocket service) — `components/Game.tsx` and `lib/game.ts` are decoupled and easy to wire up.
