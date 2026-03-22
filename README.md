# WDUSA Viral Studio

Next.js app: **Creatomate** video renders, a **Prisma/Postgres** knowledge base seeded from [Nate’s landing page](https://wdusa-nate-landing.vercel.app/) and [Window Depot Milwaukee](https://windowdepotmilwaukee.com/), and **GoHighLevel** Social Planner scheduling for Reels.

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Create a Postgres database (e.g. Vercel Postgres or Neon) and set `DATABASE_URL`.
3. Install and migrate:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
```

4. In Creatomate, create a 9:16 template with text elements named **`Hook-Text`**, **`Subhead-Text`**, **`CTA-Text`** (or adjust `defaultModifications` in the DB / seed). Set `CREATOMATE_TEMPLATE_ID` before seeding, or update the `VideoTemplate` row in the database.

5. GHL Private Integration needs scopes such as **`socialplanner/post.write`**, **`socialplanner/account.readonly`**, **`users.readonly`**.

## Scripts

- `npm run dev` — local dev
- `npm run verify` — lint, `scripts/assert-modifications.ts`, production build (`prisma generate` + `next build`; does not run `migrate deploy`)
- `npm run db:migrate` — `prisma migrate deploy` (use in CI/Vercel or after deploy)

## Vercel

1. Connect the GitHub repo and set the same environment variables as `.env.example`.
2. Recommended **Build Command**: `npm run vercel-build` (runs `prisma generate`, `prisma migrate deploy`, `next build`)
3. After first deploy, run `npx prisma db seed` once (locally against production `DATABASE_URL`, or via a one-off job) to load KB + default template.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/kb?profile=nate_landing` | List KB facts |
| POST | `/api/kb/ingest` | Re-fetch both URLs into new `SourcePage` + chunks |
| GET | `/api/templates` | Active Creatomate template rows |
| POST | `/api/renders` | Start render (`videoTemplateId`, `hook`, `subhead`, `cta`) |
| GET | `/api/renders/:id` | Poll Creatomate + update job |
| GET | `/api/ghl/accounts` | Social accounts for `GHL_LOCATION_ID` |
| GET | `/api/ghl/users` | Users (for `userId` in Schema A) |
| POST | `/api/ghl/schedule` | Schedule reel/post with rendered `outputUrl` |

**GHL:** For future posts, the API sets `status: "scheduled"` with your `scheduleDate`. Use `video/mp4` media type for Reels.

## Default contact (Nate landing)

When using profile **`nate_landing`**, curated KB facts include:

- Booking URL: `https://wdusa-nate-landing.vercel.app/`
- Phone: `(414) 312-5213`
- Email: `nlasko.wdusa.milwaukee@gmail.com`
- Company site: `https://windowdepotmilwaukee.com/`

Corporate-only rows (e.g. `(414) 795-4804`) are tagged `corporate` so messaging stays consistent per campaign.
