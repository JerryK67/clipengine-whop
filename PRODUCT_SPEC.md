# ClipEngine AI — Product & Architecture Blueprint

## 1. The Opportunity on Whop
**Content Rewards (Clipping)** is one of the fastest-growing ecosystems on Whop. Thousands of creators, streamers, SaaS founders, and podcasts post prize pools ($1,000 to $100,000+) paying clippers **$1.00 to $5.00+ per 1,000 views (RPM)** on TikTok, Instagram Reels, and YouTube Shorts.

**The Clipper's Pain Points:**
1. **Pool Depletion:** Clippers spend hours editing a clip only to realize the bounty pool is already 95% drained or rejects their niche.
2. **Rejection / Low Views:** Submissions get rejected for missing mandatory campaign requirements (watermarks, bio links, specific hashtags) or flop at 200 views because of weak 3-second hooks.
3. **Originality / Shadowbans:** Re-uploading raw stream clips triggers TikTok/Reels "unoriginal content" suppression unless the audio/visual metadata and pacing are transformed.

---

## 2. Core Features of ClipEngine AI

### Feature A: Bounty Arbitrage Radar (Live EV Calculator)
- Ranks active Content Rewards campaigns by **Effective RPM**, **Pool Remaining %**, **Approval Rate**, and **Competition Velocity**.
- Highlights "Sweet Spot" bounties (high budget remaining + high RPM + fast payout approval).

### Feature B: AI Viral Hook & Retention Script Studio
- Input a streamer/creator topic or raw transcript snippet.
- Generates **scroll-stopping 3-second visual/text hooks**, curiosity-gap captions, and on-screen text overlays tailored to the exact bounty rules.

### Feature C: Campaign Compliance & Anti-Shadowban Pre-Flight Check
- Before submitting a clip to Whop, runs a **Pre-Flight Checklist** against that specific bounty's rules (e.g., *"Must include @brand in caption"*, *"Minimum 15s length"*, *"No reposted watermarks"*).
- Provides one-click **FFmpeg / CapCut Originality Presets** (subtle pitch shift, dynamic zoom keyframes, color grade LUT settings, metadata strip command) so clips bypass duplicate-content filters.

### Feature D: Multi-Account Earnings & RPM Calculator
- Tracks views across multiple TikTok / IG / Shorts theme pages and forecasts exact Whop payouts before they hit the wallet.

---

## 3. Dual-Mode Whop Architecture (Iframe + Standalone)
- **Mode 1: Embedded Whop App (`/whop-app` or auto-detected via `x-whop-user-token` / query params)**
  - Installs directly into a Whop Hub.
  - Reads the user's Whop membership status via Whop API (`GET /api/v5/me` or SDK verification).
- **Mode 2: Standalone SaaS Website (`/`)**
  - High-converting landing page + interactive demo dashboard.
  - Uses **Whop Embedded Checkout / Checkout Redirect** (`https://whop.com/checkout/plan_...`) to unlock Pro features.

---

## 4. Monetization & Growth Loop on Whop
- **Free Tier:** Browse top 3 bounties + 2 AI Hook generations/day + Payout Calculator.
- **ClipEngine Pro ($29/mo or $9/week Pass on Whop):**
  - Full Bounty Arbitrage Radar + alerts
  - Unlimited AI Hook & Retention Scripts
  - Pre-Flight Compliance Checker & Anti-Shadowban FFmpeg Generator
- **Built-In Affiliate Flywheel:**
  - Set **40% recurring affiliate commission** on Whop. Every clipper who uses ClipEngine automatically puts their affiliate link in their TikTok/Reels bio or shares it in clipping Discords/Whops.
