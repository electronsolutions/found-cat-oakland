# Found Cat Oakland

Single-file Cloudflare Worker for a temporary public found-cat website in Oakland.

The application itself lives in `src/index.js`: public page, forms, admin pages,
CSS, Turnstile handling, D1 reads/writes, CSV exports, and reimbursement display.
The remaining files are project support files for Wrangler, D1 schema, npm, and
local environment values.

This page may be hosted on `foundcat.electronsolutionsllc.co`, but it is a
one-off community effort by Danny. It is not a paid service, animal rescue
organization, adoption agency, pet care provider, or nonprofit fundraiser.
Electron Solutions is only providing temporary web hosting/technical support.

## Files

```text
found-cat-oakland/
  .dev.vars.example
  package.json
  README.md
  schema.sql
  wrangler.jsonc
  src/
    index.js
```

## What It Does

- Prioritizes original-owner reunification.
- Accepts possible owner claims with details/photos/proof.
- Accepts screened foster, adoption, rescue-intake, and backup-foster interest.
- Publishes public updates from D1.
- Tracks itemized documented expenses, reimbursements, remaining documented need,
  receipt links, and reimbursement links.
- Provides a token-protected admin area for status, updates, submissions, CSV
  exports, expenses, and reimbursements.

## Install

```bash
cd found-cat-oakland
npm install
cp .dev.vars.example .dev.vars
```

On PowerShell:

```powershell
cd "C:\Users\vikik\Documents\Codex\2026-05-18\build-a-new-standalone-cloudflare-worker\found-cat-oakland"
npm install
Copy-Item .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set at least:

```env
ADMIN_TOKEN=make-this-long-and-random
CONTACT_EMAIL=you@example.com
```

The included Turnstile values are Cloudflare test keys for local development.

## Create D1

```bash
npx wrangler login
npx wrangler d1 create found-cat-oakland --binding DB --update-config
```

If Wrangler does not update `wrangler.jsonc`, copy the printed D1 database ID
into:

```jsonc
"database_id": "replace-with-d1-database-id"
```

## Apply Schema

Local development database:

```bash
npm run db:migrate:local
```

Remote production database:

```bash
npm run db:migrate:remote
```

The schema seeds the initial cat status and four public updates.

## Run Locally

```bash
npm run dev
```

Open the local URL Wrangler prints, usually:

```text
http://localhost:8787
```

Admin access:

```text
http://localhost:8787/admin?token=YOUR_ADMIN_TOKEN
```

After the first token login, the Worker stores the token in an HttpOnly cookie.

## Add Photos

Because this is now a single-file Worker, the photo gallery placeholders are in
`src/index.js` in the `galleryCard()` area. For the fastest first deploy, leave
the placeholders. To add real photos later, either:

- add image URLs manually in the HTML returned by `publicPage()`, or
- add a tiny route in `src/index.js` that serves uploaded image assets.

Do not include the exact apartment, building number, or private address in
images, metadata, filenames, captions, or visible backgrounds.

## Production Secrets

Set these before deploy:

```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SITE_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put CONTACT_EMAIL
```

Optional reimbursement/config values:

```bash
npx wrangler secret put PUBLIC_NEIGHBORHOOD
npx wrangler secret put VENMO_URL
npx wrangler secret put CASHAPP_URL
npx wrangler secret put PAYPAL_URL
npx wrangler secret put GOFUNDME_URL
npx wrangler secret put OPTIONAL_RECEIPTS_URL
```

Optional email notifications through Resend:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
```

If email variables are blank, submissions still work and are stored in D1.
You can also use `EMAIL_WEBHOOK_URL` for a generic webhook.

## Deploy

```bash
npm run db:migrate:remote
npm run deploy
```

Admin access after deploy:

```text
https://your-worker-url/admin?token=YOUR_ADMIN_TOKEN
```

## Admin Features

- View dashboard counts and reimbursement totals.
- Update public cat status.
- Add, edit, delete, publish, and unpublish updates.
- View owner claims and foster/adoption/rescue applications.
- Mark submissions as `new`, `reviewed`, `promising`, `rejected`,
  `owner-confirmed`, or `rescue-contacted`.
- Add internal notes to submissions.
- Export owner claims and applications as CSV.
- Add, edit, and delete expenses.
- Add and delete reimbursement records.

## Public Safety Notes

- Owner reunification comes first.
- The exact private location is never shown publicly.
- Adoption/foster placement should only happen if no credible owner is confirmed.
- No same-day impulse handoff.
- Screening is required.
- Medical facts are phrased conservatively because no full vet exam has been
  completed yet.
- Public users cannot view submissions.
- Contributions do not create adoption priority, ownership rights, or a service
  relationship.

## Checklist Before Publishing

- Replace the D1 `database_id` in `wrangler.jsonc` if needed.
- Run `npm run db:migrate:remote`.
- Set a long random `ADMIN_TOKEN`.
- Create a production Turnstile widget and set production keys.
- Add reimbursement links only if you are ready to track documented expenses and
  reimbursements.
- Remove or pause reimbursement links manually once documented costs are covered.
- Add initial expenses only when receipts or documentation are available.
- Test owner claim and application forms with Turnstile.
- Test `/admin`, CSV export, update publishing, and expense totals.

## Limitations / TODOs

- Email notifications are optional and currently support Resend or a generic
  webhook.
- Admin authentication is one shared token. For a longer-lived project, use
  Cloudflare Access.
- Reimbursement links are environment variables in this first version, not
  editable in the admin UI.
- The single-file version uses inline photo placeholders rather than `/public`
  image assets.
- Rate limiting is intentionally simple D1-backed per-IP windowing.
