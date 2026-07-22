# ALIBI™

**Plausible deniability, as a service.** The Bureau of Plausible Deniability generates weather-verified excuses using your real location and live conditions from Open-Meteo, notarized by Claude.

For entertainment purposes. Probably.

## Stack

- Vite + vanilla JS, no framework, no database, no auth
- One Vercel serverless function: [api/excuse.js](api/excuse.js) → Anthropic API (`claude-sonnet-4-6`)
- Weather + geocoding: [Open-Meteo](https://open-meteo.com) (free, no key)
- Reverse geocoding for the "use my location" path: BigDataCloud free client API

## Local development

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev
```

Without `ANTHROPIC_API_KEY`, the dev server serves a canned specimen excuse so the full UI flow is testable offline. Production has no mock — the key is required.

## Deploy to Vercel

```bash
vercel
vercel env add ANTHROPIC_API_KEY   # paste your key, all environments
vercel --prod
```

Vercel auto-detects Vite for the static build and deploys `api/excuse.js` as a serverless function. The key never reaches the client.

## Notes

- The UI is bilingual (EN/ES) via the header toggle; the generated excuse follows the active language.
- The credibility gauge, stamp slam, and count-up all have `prefers-reduced-motion` fallbacks.
