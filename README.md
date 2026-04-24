# ProConnect — Full-Stack Monorepo (Landing + CMS + API)

This repo contains **three codebases** that together power ProConnect, the ASEAN-wide hospitality hiring platform built with ASEANTA and the Indonesian Ministry of Tourism:

| Path      | What it is                            | Stack                                       | Deploys to                         |
|-----------|---------------------------------------|---------------------------------------------|------------------------------------|
| `/` (root)| Public marketing landing site + auth  | Static HTML + Tailwind (CDN) + Firebase SDK | Netlify                            |
| `/cms`    | Authenticated product (the real app)  | Nuxt 3 + Vue 3 + Vuetify + Pinia + Firebase | `proconnectcareer.com` (prod host) |
| `/api`    | Backend API                           | NestJS + TypeORM + Firebase Admin + PostgreSQL | `api.proconnectcareer.com`         |

All three share the **same Firebase project** (auth) and the **same NestJS API**. The landing site's Log In / Sign Up pages authenticate directly against Firebase, then call the NestJS API to sync the backend user row — identical to what the CMS does.

---

## Architecture

```
                 ┌──────────────────────────────────────────┐
                 │           Firebase Auth (shared)         │
                 └───────────▲────────────────▲─────────────┘
                             │                │
                 ID token    │                │ ID token
                             │                │
   ┌─────────────────────────┴───┐   ┌────────┴──────────────────┐
   │  Netlify — landing (root)   │   │  Host — CMS (/cms, Nuxt)  │
   │  login.html / signup.html   │   │  /cms/admin/dashboard etc │
   │  → calls api.proconnect...  │   │  → calls api.proconnect...│
   └─────────────────────────┬───┘   └────────┬──────────────────┘
                             │                │
                             │ Bearer <token> │ Bearer <token>
                             ▼                ▼
                 ┌──────────────────────────────────────────┐
                 │   NestJS API (/api, api.proconnect...)   │
                 │   /users, /users/me, /firebase/..., etc. │
                 │   PostgreSQL (TypeORM), Firebase Admin   │
                 └──────────────────────────────────────────┘
```

---

## Landing site (root)

First-visit marketing site: Home, Features (Employers / Schools / Jobseekers), Pricing, Browse Jobs, About, Contact, Log In, Sign Up.

**Preview locally** — just open `index.html` in a browser. No build step.

**Deploy** — auto-deploys to Netlify on push to `main`. `/cms` and `/api` are excluded from the Netlify build via `.netlifyignore` + redirect rules in `netlify.toml`.

### Pages
```
index.html                Homepage
features.html             Features overview
features-employers.html   For Employers
features-schools.html     For Schools
features-jobseekers.html  For Jobseekers
pricing.html              Pricing + comparison table
jobs.html                 Browse Jobs (with split-pane detail)
job-detail.html           Per-job permalink page
about.html                About + ASEAN partners + principles
contact.html              Contact + demo request
login.html                Real login — Firebase + api.proconnectcareer.com
signup.html               Real signup — OTP via POST /users/public-request-otp
```

### Auth integration

`login.html` and `signup.html` speak directly to the same NestJS API the CMS uses. See `assets/auth/README.md` for the endpoint table, Firebase config, and the signup handoff contract with `/cms/signup-verify-otp`.

**Required local files (gitignored):**
- `assets/auth/firebase-config.js` — copy from `firebase-config.example.js` and fill in Firebase Web SDK values.

### Brand tokens
- Primary blue: `#1E4BA8` (brand-600)
- Accent orange: `#F97316` (accent-500)
- Footer ink: `#0B1220`
- Font: Inter

---

## CMS (`/cms`)

Pulled in as a `git subtree` from [`Ogah-Rugi/ProConnect-CMS`](https://github.com/Ogah-Rugi/ProConnect-CMS). The authenticated product — job posting, Skill Passport, admin dashboards.

### Key features shipped
- **Skill Match %** — fuzzy match between candidate skills and job requirements
- **Verified Badge** — gold shield for ASEAN-MRA-TP certified professionals
- **Share Job Dialog** — WhatsApp / LinkedIn / copy-link
- **OTP phone verification** — 10 ASEAN country codes (ID, MY, SG, TH, VN, PH, BN, KH, LA, MM)
- **Google SSO**
- **Rich-text editor** (@vueup/vue-quill) for job posts
- **License library + bulk XLS import** (SheetJS)
- **Role-based dashboards** — candidates, employers, schools, admin

### Run locally
```bash
cd cms
npm install
npm run dev
```
See `cms/README.md` for full setup (Firebase keys, env vars).

### Pulling CMS updates
```bash
git subtree pull --prefix=cms \
  https://github.com/Ogah-Rugi/ProConnect-CMS.git main --squash
```

### Pushing CMS fixes back upstream
```bash
git subtree push --prefix=cms \
  https://github.com/Ogah-Rugi/ProConnect-CMS.git main
```

---

## API (`/api`)

Pulled in as a `git subtree` from [`Ogah-Rugi/ProConnect-API`](https://github.com/Ogah-Rugi/ProConnect-API) — the `production` branch. NestJS backend serving both the CMS and the landing site.

### Stack
- NestJS + TypeORM
- PostgreSQL (config in `api/dataSource.ts`)
- Firebase Admin SDK (token verification)
- Swagger docs at `/api` → `api.proconnectcareer.com/api`
- Redoc at `/docs` → `api.proconnectcareer.com/docs`

### Key modules (non-exhaustive)
- `users/` — `/users`, `/users/me`, `/users/public-request-otp`, `/users/verify-otp`, `/users/search`
- `firebase/` — `/firebase/orphan-user/:uid` (cleanup), `/firebase/orphan-users` (list)
- `auth/` — Firebase token middleware + `@Public()` decorator for open endpoints
- `jobs/`, `applicants/`, `mst_*` (masters), `events/`, `invoices/`, `feedbacks/`, etc.

### CORS allowlist (important)

`api/src/main.ts` `enableCors({...})` is the allowlist. Currently:
- `proconnectcareer.com`, `www.proconnectcareer.com`
- `proconnect.fivestarstudio.id`, `stg.proconnect.fivestarstudio.id`, `v32.proconnect.fivestarstudio.id`
- `proconnectjob.com`
- `localhost:3011`

**It does NOT include Netlify preview domains.** If you test `login.html` from `proconnect-landingpage-proto.netlify.app`, the preflight will 403. Add your Netlify URL to the `origin` array and redeploy the API, or test from the prod custom domain.

### Run locally
```bash
cd api
npm install
cp .env.example .env   # fill in DB + Firebase Admin creds
npm run start:dev
# Swagger → http://localhost:3000/api
```

### Pulling API updates
```bash
git subtree pull --prefix=api \
  https://github.com/Ogah-Rugi/ProConnect-API.git production --squash
```

### Pushing API fixes back upstream
```bash
git subtree push --prefix=api \
  https://github.com/Ogah-Rugi/ProConnect-API.git production
```

---

## Deploy topology

| Tier         | Where it runs                         | How it deploys                           |
|--------------|---------------------------------------|------------------------------------------|
| Landing      | Netlify                               | Auto-deploys on push to `main` (this repo) |
| CMS (`/cms`) | CMS's own host (see `cms/README.md`)  | Via CMS repo CI — push upstream via `git subtree push` |
| API (`/api`) | `api.proconnectcareer.com`            | Via API repo CI — push upstream via `git subtree push` |

**Netlify only publishes root HTML.** `/cms` and `/api` are listed in `.netlifyignore` and redirected to 404 so they don't leak through the static host.

---

## Contributor workflow

1. Landing-site tweaks → edit in root, commit, push to `main`.
2. CMS work → edit inside `/cms`, commit with `cms:` prefix, push upstream with `git subtree push`.
3. API work → edit inside `/api`, commit with `api:` prefix, push upstream with `git subtree push`.
4. Pulling changes someone else pushed to the CMS or API repo → use the `git subtree pull` commands in the relevant section above.

---

## Credits
- Design: ProConnect brand (blue + orange, ASEANTA-aligned)
- Partners: ASEANTA, Indonesian Ministry of Tourism
- Stack: Inter + Tailwind + Nuxt 3 + NestJS + Firebase + PostgreSQL
