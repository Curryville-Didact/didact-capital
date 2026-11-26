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
3. In Vercel project Settings, add `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`, `BLOB_READ_WRITE_TOKEN`, `SSN_ENCRYPTION_KEY`, `LENDER_EXPORT_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` before the first deploy. Do not expose these to the browser. `BLOB_READ_WRITE_TOKEN` is the Vercel Blob token used to store bank-statement PDFs. Create a Blob store in the project, then copy its read/write token. `SSN_ENCRYPTION_KEY` must be a strong random 32-byte key (`openssl rand -base64 32`) and must never be committed. `LENDER_EXPORT_SECRET` is the shared secret sent in the `x-lender-export-secret` header when calling `POST /api/lender-export`. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` send the new-application notice to Curry@didactcapital.fund. The from address must be a verified Resend sender. The Applications table in the same base needs these fields: Application ID, Full Name, Business Name, Email, Phone, Entity Type, EIN, Business Start Date, Industry, Business Address, Owner Name, Owner DOB, Ownership %, SSN Encrypted, Credit Score Range, Amount Needed, Use of Funds, How Soon, Bank Statement URLs, Status (New, Docs Review, Submitted to Lender, Approved, Declined, Funded), Lender (Credibly, Fundworks, Unassigned), Notes, and Created At. `SSN Encrypted` stores AES-256-GCM ciphertext (base64). The plaintext Social Security number is only recoverable through `/api/lender-export`.
4. Add `didactcapital.fund` under Domains.

## Project structure

- `app/page.tsx` — page composition
- `components/` — header, hero, form, problem, process, social proof, industries, footer
- `lib/lead-schema.ts` — shared Zod schema and field options
- `app/api/submit-lead/route.ts` — landing-page lead endpoint
- `app/apply/page.tsx` — full financing application
- `app/api/submit-application/route.ts` — application endpoint
- `app/api/lender-export/route.ts` — decrypts an SSN for the lender portal
- `app/api/upload-statement/route.ts` — bank statement upload endpoint
