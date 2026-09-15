<div align="center">

# TOTE

### A Decentralized Handloom & Artisan Craft Marketplace

**Vocal for Local • Atmanirbhar Bharat • PM Vishwakarma & GeM National Initiative**

A Smart India Hackathon (SIH) platform connecting rural artisans directly to
conscious urban buyers, B2B/GeM procurement, and cultural creators — with zero
middlemen, live UPI settlements, GI provenance, and vernacular voice storytelling.

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React%2019-61DAFB?logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript%205-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20v4-38BDF8?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-593D88?logo=zustand&logoColor=white)

</div>

---

## Table of Contents

- [About](#about)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Three Operating Modes](#three-operating-modes)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Data Persistence](#data-persistence)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Polyfill Note](#polyfill-note)
- [Contributing](#contributing)
- [License](#license)

---

## About

TOTE is a **three-mode** web platform for the Smart India Hackathon (SIH) that
removes intermediaries from artisan commerce. Traditional rural weavers and
craftspeople earn *zero-commission, peer-to-peer* revenue for every sale, and
buyers get authentic, GI-tagged, sustainably-made totes directly from the maker.

The platform targets a decentralized ecosystem of three personas:

1. **Buyer / Consumer** — discover and purchase handloom totes across many artisan stalls.
2. **Artisan Maker / Seller** — a high-contrast workbench for fulfillment, UPI settlement, GeM (B2B/Government) orders, and vernacular voice-catalogued products.
3. **Cultural Creator / Influencer** — pitch collabs, share trackable reel links, and earn commission on referred sales.

## The Problem

- **Middlemen extraction** — 60–70% of artisan retail margins are lost to aggregators.
- **Digital literacy barriers** — seller ERPs are complex and English-centric, unsuitable for low-literacy rural master weavers.
- **Delayed working capital** — 30–90 day credit cycles strangle small workshops.
- **Counterfeit influx** — synthetic bags dilute and counterfeit GI handlooms.
- **Ineffective influencer linkages** — micro/nano creators lack direct, trackable partnerships with rural makers.

## The Solution

| Feature | Impact |
| --- | --- |
| Multi-stall architecture, direct UPI settlement | 100% of revenue to the artisan's VPA; 240% higher take-home margin; 90-day cycles → instant on dispatch |
| Visual studio workbench + vernacular voice input | < 4 min artisan onboarding, zero technical barriers |
| GI verification & provenance certificates | 100% verified GI clusters with geo-tagged workshop origin |
| ODOP regional cluster discovery | Local raw-material craft aggregation across Indian states |
| 5-digit UTR peer-to-peer verification | Instant, verifiable, automated split payouts (NPCI) |
| Durable 12–18 oz cotton canvas / jute / linen | 1,000+ reuse cycles, zero microplastic runoff (Mission LiFE) |

## Three Operating Modes

### 🛍️ Mode 1 — Buyer / Consumer ("TOTE Market")
Routes: `/` · `/stall/[slug]` · `/cart` · `/checkout` · `/orders`

- Handmade catalog discovery with craft/GI/state filtering
- Quick View modal with fabric weight, strap drop & care details
- **Audio Artisan Storytelling** — hear the weaver on the stall page
- Multi-stall cart drawer grouped by workshop with per-stall shipping thresholds
- 4-step multi-stall checkout with UPI QR payment + 5-digit UTR entry
- Real-time delivery tracker, direct artisan chat & dispute reporting

### 🧑‍🎨 Mode 2 — Artisan Maker / Seller ("Artisan Workbench")
Routes: `/dashboard` (tabs: `catalog`, `collabs`, `b2b_hub`)

- Live production pipeline subdivided by order status
- UPI UTR verification modal & one-click payment confirmation
- Dispatch & waybill generation (BlueDart, Delhivery, India Post SpeedPost)
- **B2B / GeM hub** — corporate & government POs, HSN 42021290 catalog export, GeM tax invoices
- Creator collab review with accept/counter/decline + direct chat
- **Vernacular Product Studio** — photo uploads, stock, GI tagging, and voice-transcription input (Malayalam, Hindi, Tamil, English)

### 🎬 Mode 3 — Cultural Creator / Influencer ("Creator Studio")
Route: `/influencer`

- Live portfolio metrics (clicks, referred orders, revenue, commission)
- Craft discovery for collabs with commission & GI filters
- Pitch-atelier workflow (Reel, YouTube Short, Story Series, Lifestyle Blog; 8–25% commission; sample requests)
- Auto-generated referral URLs (`/?ref=handle&prod=id`), 1-click copy, dynamic QR codes, "Simulate Click" testing
- Direct discussion channel with artisans + UPI payout configuration

### 🔐 Mode Switching & Auth Gating
ModeSwitcherModal on every screen; switching into a persona checks the active
session, finds an existing registered profile, or redirects to
`/login?role=<buyer|seller|influencer>`, each with tailored registration fields.

## Core Features

- **Vernacular Voice Input** — artisans record product narrations in their own
  language via the browser MediaRecorder; speech is transcribed to fill the
  description field, and the same recording is uploaded as a playable "Hear the
  Artisan" audio story for buyers.
- **Auto page translation** — Google Translate widget (12 Indian languages) lets
  buyers read any description in their own language.
- **Live UPI settlement** — dynamic QR per checkout step, 5-digit UTR verification.
- **GI tags & provenance** — tamper-evident badges and cluster credentials on
  every product and stall.
- **Reel referral attribution** — end-to-end click → purchase → commission ledger.
- **Neo-Brutalist design** — monochrome ink borders, parchment canvas, tricolor
  accents, monospace data tables, high contrast accessibility.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript 5 (strict) |
| Styling | Tailwind CSS v4, Framer Motion, Lucide icons |
| State | Zustand 5 + localStorage engine (v5) |
| Media | Cloudinary (image & audio upload) |
| AI | Groq Whisper (`whisper-large-v3`) speech-to-text |
| QR | qrcode.react |
| Backend-ready | Supabase JS (with `supabase/seed.sql`) |

## Getting Started

### Prerequisites

- Node.js **18.18+** (Node 20+ recommended)
- npm (or yarn / pnpm / bun)

### Install & Run

```bash
# 1. Clone the repository
git clone https://github.com/ASP-31/SIH.git
cd SIH

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
#    Create .env.local from the template in .env.local.example

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The `dev` script runs on the webpack engine (`next dev --webpack`)
> for stable HMR with the current config.

### Production Build

```bash
npx tsc --noEmit    # strict type check
npm run build       # production bundle
npm run start       # serve on http://localhost:3000
```

## Environment Variables

Create a `.env.local` in the project root:

```env
# ── Cloudinary (image & audio media storage) ─────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Speech-to-Text ──────────────────────────────────
# Provide at least ONE of the two below.
GROQ_API_KEY=your_groq_key          # preferred (whisper-large-v3, cheap/fast)
OPENAI_API_KEY=your_openai_key      # optional alternative (whisper-1)

# ── App base URL (for QR / media absolute URLs) ─────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> The app still runs without these keys — Cloudinary uploads fall back to local
> storage, and voice transcription is disabled until an API key is present. The
> full voice → transcription → audio story flow requires at least `GROQ_API_KEY`
> (or `OPENAI_API_KEY`) plus Cloudinary credentials.

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/ai/transcribe` | Whisper speech-to-text via Groq/OpenAI (returns transcribed vernacular text) |
| `POST /api/audio/upload` | Upload seller narration to Cloudinary (folder `tote/artisan_audio`), with local/base64 fallbacks |
| `POST /api/images/upload` | Upload artisan product photos to Cloudinary |
| `POST /api/ai/generate-product` | AI-assisted product listing generation |

## Data Persistence

The app runs fully client-side with a versioned localStorage engine:

| Key | Contents |
| --- | --- |
| `tote_real_session_v5` | Active user persona session |
| `tote_registered_accounts_v5` | Registered users (password hash) |
| `tote_stalls_v5` | Artisan stalls & studio profiles |
| `tote_products_v5` | Catalog, stock, GI tags, B2B tiers |
| `tote_orders_v5` | Live orders & shipment tracking |
| `tote_b2b_orders_v5` | GeM government / corporate POs |
| `tote_collab_proposals_v5` | Creator-artisan affiliate deals |
| `tote_referral_clicks_v5` | Reel click tracking |
| `tote_artist_reviews_v5` | Verified buyer reviews |

Cross-component reactivity is handled via window custom events
(`tote_session_changed`, `tote_orders_updated`, `tote_products_changed`, ...).
A schema-ready Supabase backend (tables & seed data) is available in
[`supabase/seed.sql`](./supabase/seed.sql).

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/transcribe/       # Whisper STT
│   │   ├── ai/generate-product/ # AI listing helper
│   │   ├── audio/upload/        # Cloudinary artisan audio
│   │   └── images/upload/       # Cloudinary artisan photos
│   ├── cart/                    # Multi-stall cart drawer
│   ├── checkout/                # 4-step UPI checkout
│   ├── dashboard/               # Artisan Workbench
│   ├── influencer/              # Creator Studio
│   ├── login/                   # 3-role auth
│   ├── orders/                  # Delivery tracker + chat + disputes
│   ├── stall/[slug]/            # Artisan storytelling page
│   └── page.tsx                 # Buyer marketplace
├── components/                  # Navbar, ProductCard, QuickView, VoiceInput, modals
├── hooks/                       # useCartStore (Zustand), etc.
├── lib/                         # types, demo/localStorage data, utils
└── styles/                      # global Tailwind styles
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server (webpack engine) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Polyfill Note

Node 18/20 must have the global `FormData` / `Blob` / `File` APIs available for
the route handlers that proxy multipart uploads to Cloudinary and Groq/OpenAI.
Run with a Node version that provides these globals (Node 18.18+ with
`--experimental-global-fetch` if needed), otherwise the audio/image upload routes
may fail with `FormData is not defined`.

## Contributing

1. Fork the repo and create a feature branch.
2. Keep strict TypeScript passing: `npx tsc --noEmit`.
3. Ensure ESLint is clean: `npm run lint`.
4. Open a Pull Request describing the change and its SIH requirement alignment.

## License

See the [LICENSE](./LICENSE) file in the repository root.