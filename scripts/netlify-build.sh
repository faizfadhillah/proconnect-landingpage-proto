#!/usr/bin/env bash
# Netlify build for proconnect-landingpage-proto
# This is a STATIC site. The repo contains api/ (NestJS) and cms/ (Nuxt)
# as git subtrees for history only — they are NOT deployed here.
# This script assembles a clean _site/ containing only the landing pages.

set -euo pipefail

echo "[netlify-build] Assembling static site into _site/"

rm -rf _site
mkdir -p _site

# 1. Static HTML pages at repo root
cp -v *.html _site/

# 2. Shared assets (css/js/images + assets/api/public-api.js)
cp -rv assets _site/

# 3. Optional: netlify _redirects / _headers if present at root
[ -f _redirects ] && cp -v _redirects _site/ || true
[ -f _headers ]   && cp -v _headers   _site/ || true

# 4. robots.txt / favicon.ico if present
[ -f robots.txt ]  && cp -v robots.txt  _site/ || true
[ -f favicon.ico ] && cp -v favicon.ico _site/ || true

echo "[netlify-build] Done. Contents of _site/:"
ls -la _site/
