# Deploying to Vercel — step by step

Everything below fits in free tiers. Total time: about 15 minutes.

---

## Step 1 — Put the code in a Git repository

```bash
cd municipal-portal
git init
git add .
git commit -m "Municipal Application & Form Portal"
git branch -M main
git remote add origin https://github.com/<you>/municipal-portal.git
git push -u origin main
```

(If you prefer not to use Git, you can also run `npx vercel` from this folder and
follow the prompts — the CLI uploads the directory directly.)

---

## Step 2 — Import the project in Vercel

1. Go to **vercel.com → Add New → Project**.
2. Pick the repository. Framework preset is detected as **Next.js** — leave the
   build command and output directory at their defaults.
3. **Do not deploy yet.** Add the environment variables first (Step 3 and 4).

---

## Step 3 — Create the database (free)

In your Vercel project: **Storage → Create Database → Neon (Postgres)**, free plan.

Vercel injects `DATABASE_URL` (and some `POSTGRES_*` aliases) into every
environment automatically. You do not need to copy anything by hand.

> Prefer Supabase? Create a project at supabase.com, copy the **Connection
> string → Transaction pooler** URI, and add it manually as `DATABASE_URL`.

The app requires the `pg_trgm` and `unaccent` extensions. Both are available on
Neon and Supabase and are created automatically by `npm run db:setup`.

---

## Step 4 — Environment variables

Add these under **Settings → Environment Variables** (Production *and* Preview):

| Name | Value |
|---|---|
| `AUTH_SECRET` | 32+ random characters — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_MUNICIPALITY_NAME_NE` | e.g. `भरतपुर महानगरपालिका` |
| `NEXT_PUBLIC_MUNICIPALITY_NAME_EN` | e.g. `Bharatpur Metropolitan City` |
| `NEXT_PUBLIC_MUNICIPALITY_ADDRESS_NE` | office address in Nepali |
| `NEXT_PUBLIC_MUNICIPALITY_ADDRESS_EN` | office address in English |
| `NEXT_PUBLIC_MUNICIPALITY_PHONE` | contact number |
| `NEXT_PUBLIC_MUNICIPALITY_EMAIL` | contact email |
| `NEXT_PUBLIC_MUNICIPALITY_LOGO` | `/emblem.svg`, or your own file in `public/` |

Optional:

| Name | When to set it |
|---|---|
| `NEXT_PUBLIC_PROVINCE_NE` / `_EN`, `NEXT_PUBLIC_DISTRICT_NE` / `_EN` | shown in the government band |
| `NEXT_PUBLIC_MUNICIPALITY_WEBSITE` | link in the footer |
| `BLOB_READ_WRITE_TOKEN` | only if you enable Vercel Blob (see Step 7) |
| `MAX_UPLOAD_MB` | override the upload size limit |

`ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME` are **only** read by the setup
script — keep them in your local `.env`, not in Vercel.

Now click **Deploy**.

---

## Step 5 — Create the schema and the first administrator

Run this **once**, from your own machine, against the production database.

```bash
# Get the production DATABASE_URL:
npx vercel link            # connect this folder to the Vercel project
npx vercel env pull .env   # writes the production env vars into .env

# Then add your admin credentials to .env:
#   ADMIN_EMAIL="admin@yourmunicipality.gov.np"
#   ADMIN_PASSWORD="a-strong-password"
#   ADMIN_NAME="Portal Administrator"

npm run db:setup
```

Output should read `✓ schema ready` and `✓ administrator created`.

---

## Step 6 — Load the sample library (optional but recommended)

```bash
npm run db:seed
```

This creates 10 categories, 8 sections, 12 wards and 8 realistic services
(नागरिकता सिफारिस, जन्म दर्ता, बसोबास सिफारिस, घरबाटो सिफारिस, व्यवसाय दर्ता,
चारकिल्ला, नाता प्रमाणित, घर नक्सा पास). Every seeded record is flagged as
**sample content** and shows a visible "नमुना" badge, so staff can find and
replace it. Change the ward count with `SEED_WARD_COUNT`.

To start from an empty portal instead, just skip this step.

---

## Step 7 — File storage

**Default (nothing to do):** uploaded PDF/Word/Excel forms are stored inside
Postgres and served through `/api/files/[id]`. This needs no extra service and
stays free. The upload limit defaults to 6 MB per file, which is ample for
application templates.

**If your library gets large or you need bigger files:**

1. Vercel project → **Storage → Create → Blob**.
2. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically.
3. Redeploy. New uploads go to Blob; existing Postgres-stored files keep working.

Blob has a free allowance and then bills per GB stored and transferred — it is the
only component of this stack that can incur cost, which is exactly why it is
optional.

---

## Step 8 — First login

Open `https://<your-project>.vercel.app/admin/login`, sign in, then:

1. **वर्ग, शाखा र वडा** — adjust categories, sections and the ward list to match
   your municipality, and add further administrator accounts.
2. **निवेदन तथा सेवा** — edit or delete the sample services and add your own.
   For each one: Nepali + English title, description, category, section, wards,
   keywords, requirement checklist, procedure steps, then upload the real PDF /
   Word / Excel forms and press **प्रकाशित गर्नुहोस्**.
3. Change the administrator password (add a new admin account and remove the
   bootstrap one if you used a temporary password).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "पोर्टल सेटअप बाँकी छ / Portal setup required" | `DATABASE_URL` missing or unreachable. The schema applies itself on boot, so this is a connection problem, not a migration one — check the Vercel function logs for `[portal] schema check failed`. |
| Login always fails | `AUTH_SECRET` not set, or differs between environments |
| `permission denied to create extension` | Use Neon/Supabase (both allow `pg_trgm`), or ask your DBA to run `CREATE EXTENSION pg_trgm; CREATE EXTENSION unaccent;` |
| Upload rejected | File type must be PDF / doc / docx / odt / rtf / xls / xlsx / ods / csv, and under the size limit |
| Search finds nothing after a manual DB edit | `search_index` is rebuilt on save — re-save the application in the admin editor |

---

## Continuous deployment

Every push to `main` redeploys automatically.

**Schema changes need no manual step.** Edit `db/schema.sql` — it is written to
be re-runnable — and push. On the next deploy:

1. `npm run prebuild` compiles the file into `src/lib/schema-sql.ts`, stamping
   it with a content hash as the schema version.
2. `src/instrumentation.ts` runs once per server cold start, before the first
   request is served, and calls `ensureSchema()`.
3. `ensureSchema()` compares the `schema.version` row in `settings` with the
   embedded hash. They match on every deploy that did not touch the schema, so
   the cost is one cheap lookup. When they differ it replays the schema under a
   Postgres advisory lock — concurrent serverless instances cannot race — and
   records the new version.

`/api/setup` is only needed to create the *first* administrator on a brand-new
database. Delete `SETUP_TOKEN` afterwards; the route then returns 404.
