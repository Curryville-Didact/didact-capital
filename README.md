# Didact Capital

Single-page marketing site for Didact Capital, a working-capital matching service for construction companies and trucking and fleet operators.

The lead form validates in the browser with React Hook Form and Zod, then posts to `POST /api/submit-lead`. That route validates again and creates a record in Airtable. The Airtable token stays on the server.

## Local development

Requirements: Node.js 18.18 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run build
```

## Connect Airtable

1. Copy `.env.example` to `.env.local` if you do not already have one.
2. Set `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`. `AIRTABLE_TABLE_NAME` should be `Didact Capital Leads`.
3. Restart the server.

The route maps the form to the Airtable fields Full Name, Business Name, Email, Phone, Industry, Monthly Revenue, Amount Needed, How Soon, and Use of Funds. It also sets Submitted At, Status (`New`), and Source (`Website Form`). The hidden company-website field is a spam trap and is not written to Airtable.

The handler lives in `app/api/submit-lead/route.ts`.

## Deployment

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. In Vercel project Settings, add `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, and `AIRTABLE_TABLE_NAME` before the first deploy. Do not expose these to the browser.
4. Add `didactcapital.fund` under Domains.

## Project structure

- `app/page.tsx` — page composition
- `components/` — header, hero, form, problem, process, social proof, industries, footer
- `lib/lead-schema.ts` — shared Zod schema and field options
- `app/api/submit-lead/route.ts` — Airtable submission endpoint
