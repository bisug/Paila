<div align="center">
  <img src="src/assets/logo.svg" alt="Paila Logo" width="120" />

  <h1>Paila</h1>

  <p><strong>A seamless travel and community platform bridging the gap between tourists and local communities in Nepal.</strong></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" /></a>
    <a href="https://junctionxkathmandu.com/past-events/2026"><img src="https://img.shields.io/badge/JunctionX-Kathmandu_2026-blue?style=for-the-badge" alt="JunctionX Kathmandu 2026" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" /></a>
  </p>

  <p>
    <a href="https://github.com/bisug/Paila/issues">Report a Bug</a> ·
    <a href="https://github.com/bisug/Paila/issues">Request a Feature</a>
  </p>
</div>

---

> [!NOTE]
> This project is currently a **prototype** built during a 36-hour hackathon. It demonstrates the core concept and architecture — production readiness is a future goal.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Database Schema](#database-schema)
  - [Authentication Flow](#authentication-flow)
  - [Internationalisation](#internationalisation)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Security](#security)
- [Hackathon Context](#hackathon-context)
- [Roadmap](#roadmap)
- [Team](#team)
- [License](#license)

---

## Overview

**Paila** (पाइला — *Nepali for "footstep"*) is a full-stack web platform designed to transform how tourists experience Nepal while directly empowering local communities. It connects travellers with verified local guides, authenticated homestays, and community businesses — fostering transparent, fair, and culturally rich tourism.

The platform was built as a direct response to a challenge from the **[JunctionX Kathmandu 2026](https://junctionxkathmandu.com/past-events/2026)** hackathon, in alignment with the **UNDP – NTB Sustainable Tourism Project**.

---

## Features

| Feature | Description |
|---|---|
| 🏨 **Hotel & Homestay Discovery** | Browse and book local accommodations with verified listings |
| 🧭 **Guide Verification** | Connect with trusted guides via a formal ID-based verification workflow |
| 🗺️ **Interactive Footprint Map** | Explore Nepal's destinations with an embedded Google Maps experience |
| 🤝 **AI Translator** | Break the language barrier with real-time AI-powered translation |
| 📷 **ID Scanner** | Secure profile and booking flows with document scanning |
| 🚌 **Transport Finder** | Discover local transport options for seamless travel |
| 💬 **AI Concierge (Talk)** | An intelligent assistant for travel queries and recommendations |
| 📊 **Community Impact Dashboard** | Visualise how tourist spending benefits local communities |
| 👤 **Traveller & Business Profiles** | Separate account types for tourists and local service providers |
| 🔔 **Notifications** | Real-time in-app notifications for bookings and updates |
| 🌐 **25-language Support** | Full i18n support covering major global and regional languages |
| 🛡️ **Admin Dashboard** | Guide verification management and admin controls |

---

## Tech Stack

### Core

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| Language | [TypeScript 6](https://www.typescriptlang.org/) |
| Backend / Database | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, SSR) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/) |
| State Management | [TanStack React Query v5](https://tanstack.com/query/latest) |
| Forms & Validation | [React Hook Form](https://react-hook-form.com/) + [Zod v4](https://zod.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Charts | [Recharts](https://recharts.org/) |

### Integrations

| Integration | Purpose |
|---|---|
| [Google Maps API](https://developers.google.com/maps) | Interactive maps and geolocation |
| [OpenAI API](https://platform.openai.com/) | AI translation and concierge features |
| [i18next](https://www.i18next.com/) | Internationalisation (25 locales) |

### Tooling

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev/) | End-to-end testing |
| [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | Code quality and formatting |
| [GitHub Actions](https://github.com/features/actions) | CI: typecheck, lint, build |

---

## Architecture

Paila is a **full-stack Next.js App Router** application. The frontend and API routes are co-located in the same repository. All data persistence, real-time subscriptions, file storage, and authentication are handled by **Supabase** as the Backend-as-a-Service.

```
Browser / Client
      │
      ▼
┌─────────────────────────────┐
│   Next.js Edge Middleware   │  ← Session validation, route protection
└─────────────┬───────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
┌──────────┐      ┌────────────┐
│  React   │      │  Next.js   │
│  Pages   │      │ API Routes │
│ (RSC/CC) │      │ /api/*     │
└──────────┘      └─────┬──────┘
                        │
                        ▼
              ┌──────────────────┐
              │    Supabase      │
              │  ┌────────────┐  │
              │  │ PostgreSQL │  │
              │  ├────────────┤  │
              │  │    Auth    │  │
              │  ├────────────┤  │
              │  │  Storage   │  │
              │  └────────────┘  │
              └──────────────────┘
```

### Project Structure

```text
paila/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI pipeline (typecheck → lint → build)
├── supabase/
│   └── migrations/             # PostgreSQL schema migrations
├── src/
│   ├── app/                    # Next.js App Router root
│   │   ├── (admin)/            # Route group: Admin dashboard & guide management
│   │   ├── (app)/              # Route group: Authenticated user experience
│   │   │   ├── booking/        # Booking flows
│   │   │   ├── guide/          # Individual guide profile & verification status
│   │   │   ├── guides/         # Guide discovery & listing
│   │   │   ├── hotels/         # Hotel & homestay listings
│   │   │   ├── impact/         # Community impact dashboard
│   │   │   ├── map/            # Interactive footprint map
│   │   │   ├── notifications/  # In-app notifications
│   │   │   ├── preferences/    # User preferences
│   │   │   ├── profile/        # User profile management
│   │   │   ├── scan/           # Document / ID scanner
│   │   │   ├── talk/           # AI concierge chat
│   │   │   └── transport/      # Local transport finder
│   │   ├── (onboarding)/       # Route group: Registration & profile setup
│   │   ├── (public)/           # Route group: Login & auth callback
│   │   ├── api/
│   │   │   ├── scan/           # Serverless document scanning endpoint
│   │   │   └── translate/      # Serverless AI translation endpoint
│   │   ├── layout.tsx          # Global root layout
│   │   └── providers.tsx       # Global providers (QueryClient, Theme, Auth)
│   ├── assets/                 # Static assets (logo.svg, images)
│   ├── components/
│   │   ├── layout/             # Shell, sidebar, header components
│   │   ├── modals/             # Dialog and modal components
│   │   ├── navigation/         # Navigation bar components
│   │   ├── ui/                 # Shadcn/UI base component library
│   │   ├── views/              # Page-level feature view components
│   │   │   ├── FootprintMap.tsx
│   │   │   ├── HomeFeed.tsx
│   │   │   ├── HotelsList.tsx / HotelDetail.tsx
│   │   │   ├── GuidesSection.tsx
│   │   │   ├── TranslatorView.tsx
│   │   │   ├── ScannerView.tsx
│   │   │   ├── TransportView.tsx
│   │   │   ├── ImpactDashboard.tsx
│   │   │   └── AccountClient.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── hooks/                  # Custom React hooks (useAuth, useGeolocation, …)
│   ├── integrations/           # SDK initialisation (Supabase client, OpenAI)
│   ├── lib/                    # Utility functions, helpers, and constants
│   ├── locales/                # i18next translation files (25 languages)
│   └── styles.css              # Global CSS & Tailwind directives
```

### Database Schema

The PostgreSQL schema is managed via Supabase migrations. Core tables:

| Table | Purpose |
|---|---|
| `profiles` | User profile data; supports `traveller` and `business` account types |
| `guide_verifications` | Guide ID verification submissions with `pending / approved / rejected` status |
| `user_interests` | Tourist interest tags and onboarding state |
| `user_roles` | Role-based access control (`admin` role via enum) |
| `admin_settings` | Singleton admin configuration table |

Row-Level Security (RLS) policies and a `touch_updated_at` trigger are applied to all mutable tables.

### Authentication Flow

Authentication is managed by **Supabase Auth** and integrated into Next.js via `@supabase/ssr`.

1. **Sign-in methods:** Magic Link, Google OAuth, Phone OTP
2. **Session management:** Supabase session cookies are read by both server components and API routes via the SSR helper
3. **Route protection:** `middleware.ts` intercepts every request, validates the session cookie, and redirects unauthenticated users away from `(app)` and `(admin)` route groups
4. **Auth callback:** `/auth` handles OAuth redirects and token exchange

### Internationalisation

Paila ships with **25 locale** translation files powered by `i18next` and `react-i18next`:

`ar` · `bho` · `bn` · `bo` · `de` · `en-GB` · `en-US` · `es` · `fr` · `hi` · `id` · `it` · `ja` · `ko` · `mai` · `ne` · `new` · `pt-BR` · `ru` · `ta` · `th` · `thl` · `ur` · `vi` · `zh-CN`

Language detection is automatic via the browser, with a manual switcher available in the UI (`LanguageSwitcher.tsx`).

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v22** or later
- [npm](https://www.npmjs.com/) **v10** or later
- A [Supabase](https://supabase.com/) project (free tier is sufficient)
- A [Google Cloud](https://console.cloud.google.com/) project with the **Maps JavaScript API** enabled
- An [OpenAI](https://platform.openai.com/) API key (for AI translation and concierge features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/bisug/Paila.git
cd Paila

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and fill in your values (see table below)

# 4. Apply the database schema
# Go to your Supabase project → SQL Editor and run:
# supabase/migrations/20260530071945_baseline_schema.sql

# 5. Start the development server
npm run dev
```

The application will be available at **[http://localhost:3000](http://localhost:3000)**.

### Environment Variables

Copy `.env.example` to `.env` and populate the following:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — **server-side only, never expose to client** |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ | Google Maps JavaScript API key |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (translation & AI concierge) |
| `OPENAI_BASE_URL` | ⬜ | Override for OpenAI-compatible endpoints (defaults to `api.openai.com`) |
| `OPENAI_MODEL` | ⬜ | Model to use (e.g. `gpt-4o`, `gpt-4o-mini`) |
| `ENABLE_DEMO_SCAN` | ⬜ | Set to `true` locally to enable the mock document scanner. **Never set in production.** |

> [!CAUTION]
> Never commit your `.env` file. It is already listed in `.gitignore`. `SUPABASE_SERVICE_ROLE_KEY` grants full database access and must only ever exist on the server side.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server (after `build`) |
| `npm run lint` | Run ESLint across the codebase |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run format` | Format all files with Prettier |
| `npm run test:e2e` | Run end-to-end tests with Playwright |

---

## Deployment

The application is optimised for deployment on **[Vercel](https://vercel.com)**.

### Step 1 — Connect Your Repository

1. Log in to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import **`bisug/Paila`** from GitHub

### Step 2 — Configure the Project

Vercel will automatically detect Next.js. The defaults are correct:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Root Directory | `./` |

### Step 3 — Set Environment Variables

Add all variables from the [Environment Variables](#environment-variables) table above in the Vercel **Environment Variables** panel. Mark `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` as **server-only** (no `NEXT_PUBLIC_` prefix) so they are never bundled into the client.

### Step 4 — Deploy

Click **Deploy**. Vercel will build, optimise, and distribute the app globally via its Edge Network.

### Post-Deployment Checklist

- [ ] Add your Vercel domain to Supabase **Auth → URL Configuration → Site URL** and **Redirect URLs** (e.g. `https://your-app.vercel.app/auth`)
- [ ] Restrict your Google Maps API key to your production domain via HTTP referrer rules in [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Enable the **Google** OAuth provider in Supabase Auth settings
- [ ] (Optional) Add a custom domain in the Vercel project settings

---

## Security

| Practice | Details |
|---|---|
| Secret management | Never commit `.env`; use Vercel environment variables for production secrets |
| Supabase RLS | Row-Level Security policies enforce data isolation at the database level |
| Server-only keys | `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are never exposed to the client bundle |
| OAuth redirect validation | Only allow-listed URLs in Supabase Auth can receive auth callbacks |
| Maps API restriction | Restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` by HTTP referrer or IP |
| Demo scanner flag | `ENABLE_DEMO_SCAN` must remain unset in production — it bypasses real document verification |
| Payment processing | Do not collect raw card data; use only verified payment SDK providers (e.g. eSewa, Khalti) |

---

## Hackathon Context

Paila was built during **[JunctionX Kathmandu 2026 & FinnoFest](https://junctionxkathmandu.com/past-events/2026)** — a 36-hour immersive cross-border hackathon.

| | |
|---|---|
| **Dates** | May 29–31, 2026 |
| **Venue** | AITM College, Khumaltar, Lalitpur, Nepal |
| **Challenge Track** | Hospitality & Heritage (Smart Cities & Tourism) |
| **Organisers** | SUMS Nepal · Cogknit · HackJunction Finland |

### The Challenge

> *Build a mobile app, web platform, AI tool, or digital system that delivers a smooth and trustworthy journey for tourists while directly empowering local communities to earn more, participate actively, and preserve their culture.*

Paila directly addresses:
- ✅ Smart discovery and booking of homestays, guides, and local experiences
- ✅ Trust & safety through verified profiles and admin-moderated guide approvals
- ✅ AI-powered multi-language support for tourists and locals
- ✅ Community impact visibility via the Impact Dashboard
- ✅ Alignment with the **UNDP – NTB Sustainable Tourism Project**

---

## Roadmap

| Priority | Feature |
|---|---|
| 🔜 Near-term | Production-grade guide and homestay onboarding with real verification |
| 🔜 Near-term | Mobile-responsive PWA with offline map caching (Service Workers) |
| 🔜 Near-term | Local payment gateway integration (eSewa, Khalti, ConnectIPS) |
| 🔮 Future | Personalised itinerary generation via AI |
| 🔮 Future | Community review and rating system with anti-fraud measures |
| 🔮 Future | Native mobile apps (iOS / Android) |
| 🔮 Future | Integration with Nepal Tourism Board's official listing registry |

---

## Team

Built with ❤️ by **Runtime Terrors** from [Lincoln International College](https://licnepal.edu.np), Nepal. We would like to thank the college for providing us the opportunity to participate in this hackathon.

| Name | Role | Certificate |
|---|---|---|
| **Sankalpa Bastakoti** | Idea Lead & Team Lead | [View →](https://junctionxkathmandu.com/certificates/JXK26-1e0b0b9f4b3e) |
| **Parima Shrestha** | Documentation & Presentation | [View →](https://junctionxkathmandu.com/certificates/JXK26-bb40f7a2a41d) |
| **Bisu Ghalan** | Builder / Developer | [View →](https://junctionxkathmandu.com/certificates/JXK26-be95862b1cf4) |

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

Copyright © 2026 Sankalpa Bastakoti, Parima Shrestha, Bisu Ghalan (Runtime Terrors)

---

<div align="center">
  <sub>Built in 36 hours · Powered by Next.js & Supabase · Made in Nepal 🇳🇵</sub>
</div>
