# ProConnect Auth — Netlify ↔ Firebase ↔ CMS

This folder contains the **front-door auth UI** (`login.html`, `signup.html`) that lives on the Netlify landing site and speaks directly to the same Firebase project as the `/cms` Nuxt app.

## How the flow works

```
┌─────────────────────┐   Firebase Auth   ┌────────────────────┐
│  Netlify (static)   │ ───────────────▶ │   Firebase         │
│  login.html         │   email/pw       │   Auth project      │
│  signup.html        │   Google popup   │   (shared with CMS) │
└──────────┬──────────┘   Phone OTP       └─────────┬──────────┘
           │                                         │
           │ on success → redirect                   │ ID token
           ▼                                         ▼
┌─────────────────────┐                   ┌────────────────────┐
│  /cms/admin/        │  onAuthStateChanged  /cms NestJS API    │
│  /cms/welcome       │  picks up session │   POST /users, etc. │
│  /cms/signup-       │                   │                     │
│  verify-otp         │                   │                     │
└─────────────────────┘                   └────────────────────┘
```

The Firebase session is persisted in `browserLocalPersistence`, so when the user lands on `/cms/...`, the CMS's `firebase.client.ts` plugin picks them up via `onAuthStateChanged` — no double login.

## Files

| File                         | Purpose |
|------------------------------|---------|
| `bg2.jpg`                    | Background photo (copied from `/cms/public/images/bg2.jpg`) |
| `logo-white.svg`             | White ProConnect logo (copied from `/cms/public/logo-white.svg`) |
| `google-btn.svg`             | "Sign in with Google" button (copied from `/cms/public/google-btn.svg`) |
| `firebase-config.example.js` | Config template — copy to `firebase-config.js` and fill in |
| `firebase-config.js`         | **Your real config (gitignored)** — activates the pages |

## Setup (one-time)

```bash
# From the landing-site root:
cp assets/auth/firebase-config.example.js assets/auth/firebase-config.js
# Then paste your Firebase Console → Web SDK values into it.
```

Then, in the **Firebase Console**:

1. **Authentication → Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** (reuse the CMS's OAuth client ID)
   - Enable **Phone** (needed for the signup OTP flow)
2. **Authentication → Settings → Authorized domains**
   - Add your Netlify URL (e.g. `proconnect-landingpage-proto.netlify.app`)
   - Add your production custom domain (e.g. `proconnectcareer.com`)

## Redirect targets

On successful auth, the pages hand off to the CMS:

| Event                       | Redirect             |
|-----------------------------|----------------------|
| login.html  → success       | `/cms/admin/dashboard` |
| signup.html → email/pw done | `/cms/signup-verify-otp` (then CMS flow takes over) |
| signup.html → Google SSO    | `/cms/welcome` (pick Jobseeker / Employer / School) |

These match the `router.push(...)` targets in `/cms/app/pages/login.vue` and `/cms/app/pages/signup.vue`.

## Why ship Firebase config in public code?

Firebase Web config is **public by design** — it's not a secret. Security is enforced by:

- **Firebase Authentication** (email/password, Google OAuth, phone OTP)
- **Firestore Security Rules** (server-side rules the CMS enforces)
- **CMS backend token validation** (see `/cms/server/` for Nest API)

See Firebase's official [FAQ](https://firebase.google.com/docs/projects/api-keys#general-info) on this.
