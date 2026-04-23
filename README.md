# ProConnect — Landing + CMS Monorepo

This repo now contains **two codebases** that together power ProConnect, the ASEAN-wide hospitality hiring platform built with ASEANTA and the Indonesian Ministry of Tourism:

| Path      | What it is                              | Stack                                    |
|-----------|------------------------------------------|------------------------------------------|
| `/` (root)| Public marketing landing site            | Static HTML + Tailwind (CDN)             |
| `/cms`    | Authenticated product — the actual app   | Nuxt 3 + Vue 3 + Vuetify + Pinia + Firebase |

The landing site's **Log In** / **Sign Up** buttons point to local `login.html` / `signup.html` on the Netlify site. Those demo forms are the front door — real auth is handled by the CMS in `/cms` (Firebase Auth + OTP verification).

---

## Landing site (root)

First-visit marketing site: Home, Features (Employers / Schools / Jobseekers), Pricing, Browse Jobs, About, Contact, Log In, Sign Up.

**Preview locally** — just open `index.html` in a browser. No build step.

**Deploy** — auto-deploys to Netlify on push to `main`. See `netlify.toml`.

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
login.html                Demo login (Google SSO + email/pw)
signup.html               Demo signup (role picker + OTP hint)
```

### Brand tokens
- Primary blue: `#1E4BA8` (brand-600)
- Accent orange: `#F97316` (accent-500)
- Footer ink: `#0B1220`
- Font: Inter

---

## CMS (`/cms`)

Pulled in as a `git subtree` from [`Ogah-Rugi/ProConnect-CMS`](https://github.com/Ogah-Rugi/ProConnect-CMS). This is the real authenticated product — job posting, Skill Passport, admin dashboards.

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
See `cms/README.md` for the full setup (Firebase keys, env vars).

### Pulling CMS updates
```bash
# Fetch the latest CMS changes from the CMS repo into /cms
git subtree pull --prefix=cms \
  https://github.com/Ogah-Rugi/ProConnect-CMS.git main --squash
```

### Pushing landing-site-local CMS fixes back upstream
```bash
# Push changes made inside /cms back to the CMS repo
git subtree push --prefix=cms \
  https://github.com/Ogah-Rugi/ProConnect-CMS.git main
```

---

## Deploy topology

- **Landing site** → Netlify (serves root HTML)
- **CMS app** → separate hosting (Vercel / Firebase Hosting) at the real `proconnectcareer.com/app` or similar
- The landing site's auth pages are **demo forms** — they don't call Firebase. When the user is ready to actually sign up, the demo handler currently alerts; wiring it to the real CMS endpoint is the next integration step.

---

## Credits
- Design: ProConnect brand (blue + orange, ASEANTA-aligned)
- Partners: ASEANTA, Indonesian Ministry of Tourism
- Built with Inter + Tailwind + Nuxt
