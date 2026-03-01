# ⚡ EV Mate Japan

日本のEVオーナー向けオールインワン管理アプリ。

## Tech Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **API**: Tesla Fleet API (via node wrapper)
- **DB**: Supabase (Phase 1〜)
- **Hosting**: Vercel
- **Domain**: evmate.amorjp.com

## Setup

```bash
# Install
npm install

# Copy env
cp .env.example .env.local
# Fill in your Tesla API credentials

# Dev server
npm run dev
```

## Tesla Fleet API Setup

1. Register at [developer.tesla.com](https://developer.tesla.com)
2. Generate key pair: `openssl ecparam -name prime256v1 -genkey -noout -out keys/private-key.pem`
3. Extract public key: `openssl ec -in keys/private-key.pem -pubout -out keys/public-key.pem`
4. Public key is served at `/.well-known/appspecific/com.tesla.3p.public-key.pem`
5. Set redirect URI to `https://evmate.amorjp.com/api/auth/tesla/callback`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/tesla/         # OAuth flow
│   │   └── tesla/              # Vehicle data endpoints
│   ├── dashboard/              # Main dashboard
│   └── page.tsx                # Landing page
├── components/
│   └── dashboard/              # Dashboard widgets
├── lib/
│   ├── tesla.ts                # Tesla API client
│   ├── supabase.ts             # DB client
│   └── session.ts              # Cookie-based session
└── types/
    └── tesla.ts                # TypeScript definitions
```

## Roadmap
- [x] Phase 0: Project setup, key generation, Tesla OAuth
- [ ] Phase 1: Live vehicle data, charging history
- [ ] Phase 2: Japan charging spot map, battery health
- [ ] Phase 3: Premium subscriptions, mobile app
