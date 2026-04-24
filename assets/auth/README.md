# ProConnect Auth — Netlify ↔ Firebase ↔ NestJS API ↔ CMS

This folder contains the **front-door auth UI** (`login.html`, `signup.html`) that lives on the Netlify landing site and talks to the same Firebase project AND the same NestJS backend (`api.proconnectcareer.com`) as the `/cms` Nuxt app.

## How the flow works

```
┌──────────────────────┐                       ┌─────────────────────┐
│  Netlify (static)    │  Firebase Web SDK     │   Firebase          │
│  login.html          │ ───────────────────▶  │   Auth (shared)     │
│  signup.html         │  email/pw, Google     │                     │
└──────────┬───────────┘                       └──────────┬──────────┘
           │                                              │
           │ Firebase ID token                            │
           ▼                                              │
┌──────────────────────┐  Bearer <id_token>   ┌───────────┴─────────┐
│  assets/auth/        │  ────────────────▶   │  NestJS API         │
│  api-client.js       │                      │  api.proconnect...  │
│  (pcApiFetch)        │  GET /users/me       │  (shared with CMS)  │
│                      │  POST /users         │                     │
│                      │  POST /users/        │                     │
│                      │    public-request-otp│                     │
│                      │  DELETE /firebase/   │                     │
│                      │    orphan-user/:uid  │                     │
└──────────┬───────────┘                      └─────────────────────┘
           │ on success → redirect
           ▼
  /cms/admin/dashboard      ← returning user
  /cms/welcome              ← first-time Google user (role picker)
  /cms/signup-verify-otp    ← email/pw signup flow (CMS verifies OTP)
```

## Files

| File                         | Purpose |
|------------------------------|---------|
| `bg2.jpg`                    | Background photo (copied from `/cms/public/images/bg2.jpg`) |
| `logo-white.svg`             | White ProConnect logo (copied from `/cms/public/logo-white.svg`) |
| `google-btn.svg`             | "Sign in with Google" button (copied from `/cms/public/google-btn.svg`) |
| `firebase-config.example.js` | Config template — copy to `firebase-config.js` and fill in |
| `firebase-config.js`         | **Your real config (gitignored)** — activates the pages |
| `api-client.js`              | Minimal fetch wrapper for `api.proconnectcareer.com` (mirrors CMS `useApi.js`) |

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
2. **Authentication → Settings → Authorized domains**
   - Add your Netlify URL (e.g. `proconnect-landingpage-proto.netlify.app`)
   - Add your production custom domain (e.g. `proconnectcareer.com`)

## API base URL

Defaults to `https://api.proconnectcareer.com` (the prod NestJS API — same one the CMS hits).

Override per-environment by adding a `<script>` tag **before** the module script:

```html
<script>window.PC_API_BASE = "https://stg.api.proconnectcareer.com";</script>
```

## Endpoints the landing pages hit

| When                                 | Method | Path                               | Auth | Source reference |
|--------------------------------------|--------|------------------------------------|------|-------------------|
| After login (any provider)           | GET    | `/users/me`                        | Bearer | `users.controller.ts:440` |
| Email/password signup — request OTP  | POST   | `/users/public-request-otp`        | Public | `users.controller.ts:313` |
| Google SSO signup — create backend row | POST | `/users`                           | Public | `users.controller.ts:408` |
| Google SSO signup — orphan cleanup    | DELETE | `/firebase/orphan-user/:uid`      | Public | `firebase.controller.ts:147` |

These match 1:1 with the CMS (`cms/app/pages/login.vue`, `cms/app/pages/signup.vue`, `cms/app/pages/signup-verify-otp.vue`).

## CORS gotcha

The API's CORS allowlist (see `ProConnect-API/src/main.ts`) currently includes:

- `proconnectcareer.com`, `www.proconnectcareer.com`
- `proconnect.fivestarstudio.id`, `stg.proconnect.fivestarstudio.id`, `v32.proconnect.fivestarstudio.id`
- `localhost:3011`

It does **NOT** include `proconnect-landingpage-proto.netlify.app` or any other Netlify preview domain. If you test from a Netlify preview URL, API calls will fail the CORS preflight.

**Fix:** add your Netlify domain to the `origin` array in `ProConnect-API/src/main.ts` `app.enableCors({...})` and redeploy the API. Once the production custom domain is pointed at Netlify, no change is needed.

## Redirect targets

| Event                                      | Redirect               |
|--------------------------------------------|------------------------|
| login — email/pw or Google — backend row exists | `/cms/admin/dashboard` |
| login — Google — first time (404 on /users/me)  | Creates backend row, then `/cms/welcome` |
| signup — email/password — OTP requested    | `/cms/signup-verify-otp` (CMS finalizes) |
| signup — Google SSO — backend row created  | `/cms/welcome` |

These match the `router.push(...)` targets in `/cms/app/pages/login.vue` and `/cms/app/pages/signup.vue`.

## Signup email/password handoff contract

The CMS's `/cms/signup-verify-otp` page expects these localStorage keys (set by `signup.html` before redirecting):

- `countdownEmail`
- `countdownPhone`  (`+<country><number>`)
- `countdownPassword`

The CMS page reads these, presents the OTP input, then:
1. Creates the Firebase user via `createUserWithEmailAndPassword`.
2. `POST /users` with `{ firebase_uid, email, phone, password, otp }` to finalize.
3. On API failure, `DELETE /firebase/orphan-user/:uid` to clean up.

If you change these keys in the CMS, update `signup.html` to match.

## Why ship Firebase config in public code?

Firebase Web config is **public by design** — it's not a secret. Security is enforced by:

- **Firebase Authentication** (email/password, Google OAuth)
- **Firestore Security Rules** (server-side rules the CMS enforces)
- **CMS backend token validation** (see `/cms/server/` for Nest API)

See Firebase's official [FAQ](https://firebase.google.com/docs/projects/api-keys#general-info) on this.
