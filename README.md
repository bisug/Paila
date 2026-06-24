<div align="center">
  <img src="src/assets/logo.svg" alt="Paila Logo" width="100" />
</div>

# Paila

> **A seamless travel and community platform bridging the gap between tourists and local communities in Nepal.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Hackathon](https://img.shields.io/badge/JunctionX-Kathmandu_2026-blue?style=for-the-badge)](https://junctionxkathmandu.com/past-events/2026)
[![Status](https://img.shields.io/badge/Status-Prototype-orange?style=for-the-badge)]()

---

## Table of Contents

- [About the Project](#about-the-project)
- [Hackathon Details](#hackathon-details)
- [The Challenge Context](#the-challenge-context)
- [System Architecture](#system-architecture)
  - [Overview](#overview)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [Authentication Flow](#authentication-flow)
  - [Deployment Architecture](#deployment-architecture)
  - [Future Considerations](#future-considerations)
- [Development Journey](#development-journey)
- [Deployment Guide](#deployment-guide)
  - [Prerequisites for Deployment](#prerequisites-for-deployment)
  - [Deploying to Vercel](#deploying-to-vercel)
  - [Post-Deployment Checklist](#post-deployment-checklist)
- [Available Scripts](#available-scripts)
- [Security Guidelines](#security-guidelines)

---

## About the Project

> ⚠️ **Note:** This project is currently a **prototype** for our core idea, developed during the hackathon.

**Paila** is a comprehensive Next.js App Router-based platform tailored for Nepal's tourism sector. Our goal is to provide a smooth and trustworthy journey for tourists while directly empowering local communities (homestays, guides, and artisans). 

**Key Features Include:**
- **Hotel & Homestay Discovery:** Find the perfect local accommodation.
- **Guide Verification:** Connecting tourists with trusted, verified local guides.
- **Interactive Maps:** Built-in mapping for easy navigation.
- **Translation Services:** Breaking the language barrier between tourists and locals.
- **Scanning & ID Verification:** Secure profile and booking flows.

---

## Hackathon Details

This project was built during **[JunctionX Kathmandu 2026 & FinnoFest](https://junctionxkathmandu.com/past-events/2026)**, a 36-hour immersive cross-border hackathon.
- **Date:** May 29 - 31, 2026
- **Venue:** AITM College, Khumaltar, Lalitpur, Nepal
- **Challenge Track:** Hospitality & Heritage (Smart Cities and Tourism)
- **Organizers:** SUMS Nepal, Cogknit Oy, and HackJunction Finland

We proudly represented **[Lincoln International College](https://licnepal.edu.np)** under the team name **Runtime Terrors**.

### Team Members
- **Sankalpa Bastakoti** – Main Idea & Team Lead | [View Certificate](https://junctionxkathmandu.com/certificates/JXK26-1e0b0b9f4b3e)
- **Parima Shrestha** – Documentation & Presentation | [View Certificate](https://junctionxkathmandu.com/certificates/JXK26-bb40f7a2a41d)
- **Bisu Ghalan** – Builder / Developer | [View Certificate](https://junctionxkathmandu.com/certificates/JXK26-be95862b1cf4)

*Note: For everyone except our lead, Sankalpa, this was an exciting first-time hackathon experience!*

---

## The Challenge Context

*This project was built as a direct response to the following hackathon challenge:*

### Problem
Tourists often face inconsistent and difficult experiences from arrival to departure — especially in emerging destinations and trekking areas outside Kathmandu and Pokhara. At the same time, local homestays, guides, artisans, and villages receive limited direct benefits from tourism.

### The Challenge
Build a mobile app, web platform, AI tool, chatbot, or digital system that delivers a smooth and trustworthy journey for tourists while directly empowering local communities to earn more, participate actively, and preserve their culture.

### Key Features Addressed
- Smart discovery and booking of homestays, local guides, and experiences
- Trust & safety layer (verified profiles, ratings, emergency support)
- Transparent pricing and fair revenue sharing for locals
- Multi-language support (Nepali + English + others)

### Alignment
This challenge directly supports the UNDP – NTB Sustainable Tourism Project, focusing on:
- Digital transformation of tourism
- Community livelihoods and inclusive employment
- Sustainable destination development
- Heritage preservation

---

## System Architecture

### Overview
Paila is designed as a modern web application leveraging the **Next.js App Router** paradigm. It operates as a full-stack React application where the frontend and API routes are co-located. The backend data layer, real-time subscriptions, and authentication are entirely managed by **Supabase**, acting as our Backend-as-a-Service (BaaS).

The platform emphasizes performance, localized user experiences (multi-language support), and a modular, component-driven UI.

### Technology Stack
- **Core Framework:** Next.js (v16+) & React (v19)
- **Backend & Database:** Supabase & Supabase SSR
- **UI & Styling:** Tailwind CSS (v4), Radix UI, Shadcn/UI, Lucide React
- **State Management:** TanStack React Query (v5), React Hook Form, Zod
- **Key Integrations:** Google Maps API, i18next
- **Package Manager:** npm

### Project Structure
The project follows a scalable, domain-driven structure within the `src/` directory.

```text
src/
├── app/                  # Next.js App Router root
│   ├── (admin)/          # Route group: Admin dashboard and management features
│   ├── (app)/            # Route group: Main authenticated user experience (bookings, maps)
│   ├── (onboarding)/     # Route group: User registration and profile setup flows
│   ├── (public)/         # Route group: Publicly accessible pages (landing, about)
│   ├── api/              # Next.js API routes (serverless functions)
│   ├── layout.tsx        # Global HTML/Root layout
│   └── providers.tsx     # Global React context providers (QueryClient, Theme, Auth)
├── assets/               # Static assets (SVGs, Images, like logo.svg)
├── components/           # Reusable UI components (buttons, inputs, cards)
├── hooks/                # Custom React hooks (e.g., useAuth, useGeolocation)
├── integrations/         # Third-party SDK initializations (Supabase, OpenAI)
├── lib/                  # Utility functions, helpers, and constants
├── locales/              # Translation JSON files for i18next
├── styles.css            # Global CSS and Tailwind directives
```

### Authentication Flow
Authentication is managed via Supabase Auth and integrated securely into Next.js using `@supabase/ssr`.
1. **Client/Server hybrid:** Users can log in via Magic Links, Google OAuth, or Phone/OTP.
2. **Middleware Protection:** Next.js `middleware.ts` intercepts route requests to verify the Supabase session cookie. Unauthenticated users attempting to access `(app)` or `(admin)` routes are automatically redirected.

### Deployment Architecture
The application is optimized for deployment on **Vercel**. 
- **Frontend:** Deployed globally on Vercel's Edge Network.
- **Database:** Supabase handles the PostgreSQL database, logically located close to the target demographic.
- **Environment Variables:** Strictly separated between `NEXT_PUBLIC_` and secure server-only keys (`SUPABASE_SERVICE_ROLE_KEY`).

### Future Considerations
As Paila scales, the architecture is primed to handle:
1. **Offline-first capabilities:** Using Service Workers to cache map data.
2. **Advanced AI:** Expanding integrations for personalized itineraries.
3. **Payments:** Integrating local payment gateways (eSewa, Khalti).

---

## Development Journey

Building Paila was an adventurous process! Here is a brief timeline of our tech migrations during the hackathon:
1. **Initial Conception:** The project was first conceptualized and built using **Codex**.
2. **First Migration:** We then migrated the project to **Google Antigravity**.
3. **Exploration:** Seeking rapid UI iteration, we moved the project to **Lovable**.
4. **Return to Roots:** After exhausting our Lovable credits, we moved the codebase back to **Google Antigravity**.
5. **Deployment Pivot:** Finally, to successfully deploy our application on Vercel, we executed a last-minute migration from Tanstack to **Express**.

---

## Deployment Guide

Follow these instructions to deploy the Paila platform to **Vercel** for production.

### Prerequisites for Deployment
- A GitHub, GitLab, or Bitbucket account with your repository.
- A [Vercel account](https://vercel.com/signup).
- A [Supabase account](https://supabase.com/) with a configured project.
- Active API keys for integrations (e.g., Google Maps).

### Deploying to Vercel

Vercel provides a seamless deployment experience tailored for Next.js applications. 

#### Step 1: Connect your Repository
1. Log in to your Vercel dashboard.
2. Click on **Add New...** and select **Project**.
3. Import the repository containing the Paila codebase.

#### Step 2: Configure the Project
1. **Framework Preset:** Vercel should automatically detect **Next.js**. If not, select it from the dropdown.
2. **Root Directory:** If your Next.js app is in the root, leave it as `./`. If it's in a subdirectory, configure accordingly.
3. **Build Command:** `npm run build` (default).
4. **Output Directory:** `.next` (default).

#### Step 3: Set Environment Variables
Before deploying, you must configure your environment variables. In the **Environment Variables** section, add the necessary keys matching your local `.env` file. 

*Crucial Variables:*
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Ensure this is kept secure and never exposed to the client)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

#### Step 4: Deploy
1. Click the **Deploy** button.
2. Vercel will build the application and deploy it to their Edge Network. 
3. Once completed, you will receive a preview URL and your production domain.

### Post-Deployment Checklist
- **Supabase Auth Redirects:** Update your Supabase Auth settings to include your new Vercel domain in the **Site URL** and **Redirect URLs** list (e.g., `https://your-domain.vercel.app/auth/callback`).
- **Domain Configuration:** (Optional) Add a custom domain through the Vercel dashboard under project settings.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the app in development mode. |
| `npm run build` | Builds the app for production. |
| `npm run lint` | Lints the codebase for potential errors. |
| `npm run typecheck` | Runs TypeScript type checking. |
| `npm run test:e2e` | Runs end-to-end tests. |

---

## Security Guidelines

When deploying to production, please adhere to these security practices:

- **Never commit your `.env` file.**
- Add your deployed origin and `/auth/callback` to the Supabase Auth redirect allow list.
- Enable the Google provider in Supabase Auth for Gmail/Google sign-in.
- Restrict Google Maps API keys by HTTP referrer or IP address.
- Keep `SUPABASE_SERVICE_ROLE_KEY` strictly on the server-side.
- Use verified payment provider SDKs; **do not** collect sensitive card credentials directly.

---
*Built by **Runtime Terrors**.*
