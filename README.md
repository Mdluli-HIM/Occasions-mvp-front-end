# Occasions MVP frontend

Next.js app for browsing event service providers, comparing packages, planning events, and managing bookings. Uses the separate [Occasions API](https://github.com/Mdluli-HIM/Occasions-mvp-back-end).

## Local development

Use Node.js 22.

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

The frontend runs on http://localhost:3000 and expects the local API on port 4000. The only required frontend environment variable is `NEXT_PUBLIC_API_URL`. It is public, embedded in the browser bundle at build time, and must point to an HTTPS backend origin when deployed. It must not include `/api` or a trailing slash. Authentication uses API-issued bearer tokens; database URLs and the backend signing secret must never be added to the frontend.

## Validation

```bash
npm run lint
npm run build
```

GitHub Actions runs these checks on pushes and pull requests with a placeholder API URL, without database credentials.

## Vercel beta deployment

1. Import [Mdluli-HIM/Occasions-mvp-front-end](https://github.com/Mdluli-HIM/Occasions-mvp-front-end) in Vercel.
2. Use framework **Next.js**, root directory **./**, install command `npm ci`, build command `npm run build`, and the default Next.js output directory. Node.js 22 is declared in `package.json`.
3. Set `NEXT_PUBLIC_API_URL` to the HTTPS origin assigned to the backend Render service, in both Production and Preview environments where you will test.
4. Deploy `main`. Changing the API environment variable requires a new frontend build.
5. Copy the actual frontend origin (for example `https://your-project.vercel.app`) into the backend's `CORS_ORIGIN` environment variable. Use exact origins; add individual preview origins explicitly when needed.

See [Vercel Git deployments](https://vercel.com/docs/git) and [environment variables](https://vercel.com/docs/environment-variables).

Use the generated HTTPS link on phones, tablets, and other computers. A GitHub push alone does not create a working live site: both the backend and frontend must be deployed, the database schema must match, and the API/CORS origins must point to each other.

Before inviting testers, check browsing and budget filters, signup/login, provider listing/package edits, image uploads, event planning, cart checkout, and customer/provider booking access. Use test event details. The Render Free backend can take about a minute to wake up after 15 minutes idle. Its local uploaded photos are temporary and can disappear on restarts or idle shutdown; use durable object storage before relying on provider uploads. [Render Free limitations](https://render.com/docs/free).

Do not commit `.env.local`, tokens, local uploads, dependency folders, or generated build output. The separate backend repository contains the database migration instructions and the Render Blueprint.
