# Paila

Paila is a Next.js App Router travel/community platform for Nepal tourism. It includes hotel discovery, guide verification, maps, translation, scanning, and profile/bookings flows.

## Requirements

- Node.js 22 or newer
- npm
- Supabase project
- Google Maps API keys
- Optional OpenAI-compatible chat completions provider

## Setup

Copy `.env.example` to `.env` and fill the values:

```bash
cp .env.example .env
```

Required for core app/auth:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Required for admin ID-card signed URLs:

- `SUPABASE_SERVICE_ROLE_KEY`

Required for maps:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_API_KEY`

Optional AI features:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

## Package Manager

Use npm for dependency management. The canonical lockfile is `package-lock.json`.

## Security Notes

- Never commit `.env`.
- Add your deployed origin and `/auth/callback` to the Supabase Auth redirect allow list.
- Enable the Google provider in Supabase Auth for Gmail/Google sign-in.
- Enable Phone Auth and configure a production SMS provider before using phone signup.
- Configure custom SMTP for production email confirmations and password recovery.
- Restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` by HTTP referrer in Google Cloud.
- Restrict `GOOGLE_MAPS_API_KEY` by server/IP where possible.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Use real payment provider redirects/SDKs; do not collect wallet credentials directly.
