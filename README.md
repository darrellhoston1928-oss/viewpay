# Viewpay | Premium Creator Monetization & E-Code Wallet Platform

**Viewpay** is a full-stack, mobile-responsive web platform designed for premium content monetization. Content creators upload high-resolution photos and videos with customizable paywalls, while viewers fund an internal USD wallet using **Razer Gold** and **Apple Gift Card** digital e-codes verified manually by platform administrators.

---

## 🌟 Key Architecture & Highlights

- **Currency**: Exclusively US Dollar (**USD $**).
- **Dark-Mode-First Premium Design**: Tailored in Deep Carbon (`#090a0f`), frosted glassmorphism, with gold (`#eab308`) and emerald glow accents.
- **Mobile Responsive**: Native app-style bottom navigation bar, touch-friendly drawers, and adaptive cards.
- **Manual Admin Verification E-Code Deposit Flow**:
  - Viewers submit Razer Gold or Apple Gift Card codes with claimed face value and optional receipts.
  - Codes are encrypted at rest with **AES-256-GCM**; viewers never see raw codes after submission.
  - SHA-256 duplicate code detection prevents resubmission of used/pending codes.
  - Rate limiting (max 5/hour) and automatic cooldown lockout after 3 rejected codes.
  - High-value ($100+) and first-time user deposit flags.
  - Modular redemption adapter (`redemptionAdapter.js`) prepared for future API automation.
- **Admin Review Queue & Security Audit Log**:
  - Full review queue with user history stats (approved vs rejected count).
  - Encrypted code reveal with automatic audit logging (Admin ID, timestamp, IP address, details).
  - Deposit approval with adjustable credited amount & automatic wallet ledger update.
  - Rejection with standardized reasons + custom notes & notification dispatch.
- **Creator Studio & Monetization**:
  - 18+ identity verification requirement with ID/selfie document uploads.
  - Pay-per-post unlocks + Monthly VIP recurring subscriptions.
  - Transparent 20% platform commission (80% net to creator).
  - Payout withdrawal request queue (PayPal, Bank Wire, USDT-TRC20) with $50 minimum threshold.
- **Content Protection & Compliance**:
  - Anti-piracy signed expiring media streaming tokens (`HMAC-SHA256`).
  - Right-click, drag, and context menu inspection prevention with watermarking.
  - Content reporting system, 18+ enforcement, Terms of Service, Privacy Policy, and DMCA takedown notice submission.

---

## 🔑 Pre-Seeded Test Accounts

You can switch between any of these test accounts instantly via the **"Demo Persona"** dropdown in the top navigation bar, or log in manually using password: `Password123!`

| Role / Persona | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Owner Admin** | `admin@viewpay.com` | `Password123!` | Full control: deposit approval, user bans, platform commission settings |
| **Deposit Reviewer** | `reviewer@viewpay.com` | `Password123!` | Staff reviewer: reviews e-codes, reveals codes, approves/rejects deposits |
| **Creator (Elena)** | `elena@viewpay.com` | `Password123!` | Verified artist: 3 posts (4K locked cosplay set, public teaser, masterclass video) |
| **Creator (Marcus)**| `marcus@viewpay.com` | `Password123!` | Verified fitness creator: high-intensity workout videos & nutrition guide |
| **Creator (Chloe)** | `chloe@viewpay.com` | `Password123!` | Verified fashion creator: backstage Milan lookbook |
| **Viewer (With Bal)**| `viewer@viewpay.com` | `Password123!` | Active viewer: **$85.00 USD balance**, deposit history, unlocked sets |
| **New Viewer** | `newbie@viewpay.com` | `Password123!` | New member: **$0.00 balance** (perfect for testing e-code deposit flow) |

---

## 🚀 Quick Start Guide

### 1. Start the Platform
```bash
# Run the integrated full-stack server (Serves API + Frontend on http://localhost:5000)
pnpm start

# Or develop with hot module reloading:
# Terminal 1 (Backend API on :5000):
node --watch backend/server.js

# Terminal 2 (Vite Frontend on :5173):
cd frontend && pnpm run dev
```

### 2. Run the Verification Test Suite
```bash
node backend/test_suite.js
```
Runs 18 automated integrity tests covering AES-256 encryption, HMAC signed media tokens, duplicate hash detection, wallet balance updates, 18+ compliance, and commission splits.

---

## 📋 Comprehensive Feature Checklist

### 1. Authentication & Security
- [x] Manual registration with email, password, and display name.
- [x] Role selection on sign up: **Viewer** or **Creator**.
- [x] Strict **18+ confirmation** checkbox required for registration.
- [x] Password hashing with `bcryptjs` (salt rounds: 10).
- [x] Google OAuth one-click authentication simulation.
- [x] Email verification token generation & simulated email logs.
- [x] Forgot password & reset password flow with expiring tokens.
- [x] Session management with JWT tokens.
- [x] Account settings (update avatar, display name, bio, change password, delete account).

### 2. Viewer & Wallet Features
- [x] **Explore Creators**: Filter by categories (*Art & Cosplay, Fitness, Fashion, Photography, Gaming, Lifestyle, Music*), search by keywords, sort by popularity or newest.
- [x] **Creator Profiles**: Banner, avatar, verified badge, bio, stats, monthly subscription button.
- [x] **Unlock Content**:
  - (a) Pay-per-post one-time unlock.
  - (b) Monthly creator VIP subscription pass.
- [x] **Wallet System**:
  - Live USD balance display in header.
  - Automatic deductions upon unlock or subscription.
  - **Insufficient-balance prompt modal** with shortfall calculation and 1-click link to Deposit.
- [x] **Library**: Unlocked media feed, active creator subscriptions list, and saved bookmarks.
- [x] **Notifications**: In-app feed + **Outbound Email Logs Inspector** (shows simulated emails sent to user).

### 3. E-Code Wallet Deposit Flow (Manual Admin Verification)
- [x] **Supported Card Types**: Razer Gold e-Code & Apple Gift Card (US USD).
- [x] **Deposit Form**:
  - Card selector.
  - E-code input with auto-formatting and AES-256-GCM encryption.
  - Claimed face value in USD with quick chips ($25, $50, $100, $200).
  - Optional receipt screenshot file upload.
  - Quick test button: *"Auto-Fill Demo Code"*.
  - Initial deposit status: `pending`.
  - Notice displayed: *"Your deposit is awaiting verification by our team."*
- [x] **Security Protections**:
  - Viewer cannot see raw code after submission (masked as `••••-••••-XXXX`).
  - Codes cannot be edited or canceled once submitted.
  - SHA-256 duplicate detection blocks resubmission.
  - Hourly rate limit (5 per hour per user).
  - Automatic 2-hour cooldown lock after 3 rejected codes.
  - First-time user & high-value ($100+) review flags.

### 4. Creator Studio
- [x] Creator application with government ID / selfie document upload.
- [x] Creator dashboard: total earnings, active subscribers, available balance, MRR projection.
- [x] Upload photos (JPG, PNG, WebP) and videos (MP4, MOV).
- [x] Custom titles, descriptions, categories, and free vs locked paywall toggle.
- [x] Live fan card preview simulator with blurred teaser generator.
- [x] Payout request page (PayPal, Bank Wire, USDT) with $50 minimum threshold.
- [x] Configurable 20% platform commission (80% net to creator).

### 5. Admin & Owner Panel
- [x] Multi-admin RBAC: **Owner Admin** (full control + settings) vs **Deposit Reviewer** (review queue).
- [x] **Deposit Review Queue**:
  - Filter by pending/approved/rejected, card type, user search.
  - Pending badge counter with live alerts.
  - User history context (approved vs rejected count).
  - **Reveal Code** button (decrypts AES ciphertext and records immutable entry in audit log).
  - Receipt inspection modal/lightbox.
  - **Approve**: Confirm or edit credited USD amount.
  - **Reject**: Predefined reasons + custom note, sends email & in-app alert.
- [x] **Creator Verification Queue**: Review submitted ID documents, approve or reject.
- [x] **Payout Requests Queue**: Confirm disbursements, mark as paid or reject.
- [x] **Content Moderation**: Review user-flagged posts, hide/remove posts, ban abusive users.
- [x] **Security Audit Log**: Immutable record of all sensitive actions.
- [x] **Platform Settings** (Owner only): Commission cut %, min payout, high value threshold, rate limit rules.

### 6. Content Protection & Compliance
- [x] Signed expiring URLs (`/api/posts/stream/:id?token=...&expires=...`) via HMAC-SHA256.
- [x] Right-click disable, drag prevention, and video `controlsList="nodownload"`.
- [x] Content reporting modal with categories (DMCA copyright, inappropriate, underage, scam).
- [x] Dedicated legal pages: **Terms of Service** (18+ rules), **Privacy Policy**, and **DMCA Takedown Notice Form**.
