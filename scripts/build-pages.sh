#!/usr/bin/env bash
# GitHub Pages build for proconnect-landingpage-proto
# This is a STATIC site. The repo contains api/ (NestJS) and cms/ (Nuxt)
# as git subtrees for history only — they are NOT deployed here.
# This script assembles a clean _site/ containing only the landing pages.

set -euo pipefail

echo "[pages-build] Assembling static site into _site/"

rm -rf _site
mkdir -p _site

# 1. Static HTML pages at repo root
cp -v *.html _site/

# 2. Shared assets (css/js/images + assets/api/public-api.js)
cp -rv assets _site/

# 3. robots.txt / favicon.ico if present
[ -f robots.txt ]  && cp -v robots.txt  _site/ || true
[ -f favicon.ico ] && cp -v favicon.ico _site/ || true

# 4. Tell Jekyll on GitHub Pages to leave files alone
touch _site/.nojekyll

# 5. /home -> / redirect (Netlify handled this server-side; emulate via meta refresh)
mkdir -p _site/home
cat > _site/home/index.html <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>Redirecting…</title>
<link rel="canonical" href="/">
<meta http-equiv="refresh" content="0; url=/">
<p>Redirecting to <a href="/">/</a>…</p>
HTML

echo "[pages-build] Done. Contents of _site/:"
ls -la _site/
