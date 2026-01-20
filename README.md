# Project Beast (CodeColosseum)

🎮 A gamified LeetCode tracking platform that makes coding addictive.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: Express + Socket.io
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: Clerk

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development servers
npm run dev
```

## Project Structure

```
project-beast/
├── apps/
│   ├── web/          # Next.js frontend
│   └── server/       # Express + Socket.io backend
└── packages/
    ├── database/     # Prisma schema & client
    └── shared/       # Shared types & utilities
```

## Features

- 🔥 **Beast Dashboard** - Cyberpunk-styled progress tracking
- 🗡️ **The Dojo** - Real-time multiplayer coding battles
- 💰 **BeastCoins** - Economy system with wagering
- 🏆 **Leagues** - Weekly tiered competitions
- 📊 **RPG Heatmap** - Adventure-style progress visualization
