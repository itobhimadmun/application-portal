# Municipal Application & Form Portal
### निवेदन तथा फारम पोर्टल

A production-ready, bilingual (नेपाली / English) portal that lets a citizen find the
right municipal application — **without knowing the section, the ward, or the official
name of the service** — then read the requirements, follow the procedure, download or
fill the form, print it and submit it.

Municipal staff manage the whole library from an admin dashboard. No code changes are
needed to add, edit, publish or unpublish a service.

---

## 1. What is built (Phases 1–4 + online forms)

| Area | Status |
|---|---|
| Project structure, Postgres schema, migrations, seed data | ✅ |
| Bilingual system (ne/en) for UI **and** content | ✅ |
| Admin authentication, protected routes, password hashing | ✅ |
| Public homepage, search-first layout, browse by category / section / ward | ✅ |
| Search results with combined filters and pagination | ✅ |
| Application detail page: about, requirement checklist, step timeline, document actions | ✅ |
| Printer-friendly sheet for every service | ✅ |
| PDF / Word / Excel upload, download, in-page PDF preview | ✅ |
| Smart search — Nepali, English, partial, romanised, mixed-language, fuzzy | ✅ |
| Admin dashboard, application CRUD, steps, requirements, keywords, publish/unpublish/archive | ✅ |
| Categories / sections / wards management, admin user management | ✅ |
| Online fillable form + print / save-as-PDF | ✅ |
| Mobile-first responsive layout, WCAG-minded markup | ✅ |
| 8 realistic sample services, flagged as sample content | ✅ |

Deferred by design (the schema and architecture already allow them):
online submission & tracking, SMS/email notifications, QR codes, digital signatures,
citizen accounts, analytics dashboards, feedback/rating, public API.

---

## 2. Architecture

```
┌──────────────────────────── Vercel ─────────────────────────────┐
│                                                                 │
│  Next.js 16 (App Router, React 19, TypeScript, Tailwind v4)     │
│                                                                 │
│  • Public pages      – server-rendered, no JS required to read  │
│  • Server Actions    – all writes (auth, CRUD, uploads)         │
│  • Route handlers    – /api/files/[id], /api/suggest, /api/lang │
│  • proxy.ts          – edge guard, verifies the admin session   │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
        ┌───────▼────────┐           ┌────────▼──────────┐
        │  PostgreSQL    │           │  File storage     │
        │  (Neon free)   │           │  Postgres BYTEA   │
        │                │           │  ── or ──         │
        │  data + search │           │  Vercel Blob      │
        └────────────────┘           └───────────────────┘
```

**Why these choices**

* **Postgres only, by default.** Uploaded forms are stored in a `BYTEA` column, so a
  working deployment needs exactly one free service (a Postgres database) and no
  object store at all. Set `BLOB_READ_WRITE_TOKEN` later and new uploads
  transparently move to Vercel Blob — both storage modes coexist in the same table.
  Nothing is ever written to the Vercel filesystem, which is ephemeral.
* **No ORM.** `postgres.js` with tagged-template SQL — small, fast on serverless,
  and honest about what each query does.
* **No paid AI.** Search is Postgres `pg_trgm` + a purpose-built romanisation layer
  (see §3). It works offline and costs nothing per query.
* **Session cookie, not a third-party auth service.** `bcryptjs` for hashing, a
  signed JWT (`jose`) in an httpOnly cookie, verified at the edge in `src/proxy.ts`.
* **Content is bilingual in the database**, not machine-translated at render time.
  Every text column exists as `*_ne` and `*_en`, and `pick()` falls back gracefully
  when one language is missing.

### Data model

```
admin_users
categories ── applications ── application_steps
sections   ──     │        ── application_documents      (requirement checklist)
wards      ──┬────┘        ── application_files          (pdf / word / excel)
             └── application_wards                       (many-to-many)
settings, search_log
```

`applications.search_index` is a denormalised text blob rebuilt on every save.
Adding a column later needs only a migration — nothing else in the app assumes a
fixed shape.

---

## 3. How the search actually works

A citizen who types `घर बनाउने`, `sifaris`, `nagarikta`, `naksa pass` or `birth`
must land on the right service. Four free techniques are combined:

1. **A pre-expanded index.** On save, every title, description, keyword and alias is
   passed through `buildSearchIndex()`, which stores three spellings of each term:
   the original, a phonetic romanisation of any Devanagari (`सिफारिस → sifaaris`) and
   a *skeleton* form that collapses the ambiguities Nepali speakers actually vary on
   — long/short vowels, `श/ष/स`, aspirates, `b/v/w`, `ph/f`.
2. **Substring matching** on that index, so partial words (`नाग`) work.
3. **Trigram word-similarity** (`pg_trgm`) for typo tolerance (`charkila` →
   `चारकिल्ला`).
4. **Weighted ranking** — exact title match ≫ title substring ≫ index hit ≫ fuzzy.

Admins add keywords and alternative names per service, which feed straight into
step 1. Nothing here calls an external API.

Verified behaviour with the seeded library:

| Query | Top result |
|---|---|
| `घर बाटो` | घरबाटो सिफारिस |
| `नाग` | नागरिकता सिफारिस |
| `citizenship` | नागरिकता सिफारिस |
| `nagarikta` | नागरिकता सिफारिस |
| `sifaris` | (all recommendation services) |
| `ghar banaune` | घर नक्सा पास सम्बन्धी निवेदन |
| `charkila` | चारकिल्ला प्रमाणित सिफारिस |
| `birth registration` | जन्म दर्ता |

---

## 4. Local development

Requirements: Node 20+ and a PostgreSQL 14+ database.

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL and AUTH_SECRET
npm run db:setup              # creates the schema + the first admin user
npm run db:seed               # optional: 8 sample services, 10 categories, 12 wards
npm run dev                   # http://localhost:3000
```

Sign in at `/admin/login` with the credentials from `.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`). **Change the password after the first login.**

Useful scripts:

| Command | Purpose |
|---|---|
| `npm run db:setup` | Apply `db/schema.sql`, create/ensure the first admin |
| `npm run db:seed` | Load (or refresh) the sample library |
| `npm run db:reset` | Drop every portal table — development only |
| `npm run build` | Production build |

---

## 5. Deploying to Vercel

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the click-by-click version.
Short form:

1. Push this folder to a Git repository and import it in Vercel.
2. Vercel → **Storage** → create a **Neon** Postgres database (free tier).
   It injects `DATABASE_URL` automatically.
3. Add `AUTH_SECRET` (32+ random characters) and the `NEXT_PUBLIC_MUNICIPALITY_*`
   branding variables.
4. Deploy, then run `npm run db:setup` (and optionally `npm run db:seed`) once, from
   your machine, against the production `DATABASE_URL`.
5. Sign in at `https://your-app.vercel.app/admin/login`.

**Cost:** everything above fits inside free tiers (Vercel Hobby + Neon free).
The only component that can eventually cost money is **Vercel Blob**, which is
optional — leave it unconfigured and forms live in Postgres instead.

---

## 6. Branding

No municipality name is hardcoded. Set these in `.env` / Vercel environment
variables and the whole portal rebrands:

```
NEXT_PUBLIC_MUNICIPALITY_NAME_NE, NEXT_PUBLIC_MUNICIPALITY_NAME_EN
NEXT_PUBLIC_MUNICIPALITY_ADDRESS_NE, NEXT_PUBLIC_MUNICIPALITY_ADDRESS_EN
NEXT_PUBLIC_PROVINCE_NE / _EN, NEXT_PUBLIC_DISTRICT_NE / _EN
NEXT_PUBLIC_MUNICIPALITY_PHONE, _EMAIL, _WEBSITE, _LOGO
```

Drop your emblem into `public/` and point `NEXT_PUBLIC_MUNICIPALITY_LOGO` at it.

---

## 7. Design system

The interface follows the Government of Nepal design language: flag-anchored
colours (crimson `#CE1126`, Prussian blue `#003893`), a restrained neutral scale,
6px radii, no gradients or glassmorphism, Noto Sans Devanagari with extra line
height so matras never clip, 44px minimum touch targets, and visible focus rings.

All tokens live in `src/app/globals.css` under `@theme`; components (`.btn-*`,
`.gov-card`, `.gov-input`, `.badge-*`, `.alert-*`, `.gov-table`) are defined once
and reused everywhere rather than styled per page.

---

## 8. Security notes

* Passwords hashed with bcrypt (cost 10); never stored or logged in plain text.
* Admin session = signed JWT in an httpOnly, SameSite=Lax, Secure cookie (8h).
* `src/proxy.ts` rejects unauthenticated `/admin/*` requests at the edge, and every
  server action re-checks the session server-side.
* Uploads are validated by extension **and** MIME type, and capped by size.
* `/api/files/[id]` refuses to serve a file whose application is not `published`.
* Destructive admin actions require a two-step in-page confirmation.
* Public queries only ever return `status = 'published'` rows.

---

## 9. Project layout

```
db/schema.sql                     Idempotent Postgres schema
src/app/                          Routes (public + admin + API)
src/components/                   Reusable UI, all following the design system
src/components/admin/             Admin-only client components
src/lib/db.ts                     Postgres client
src/lib/queries.ts                All reads, including the search engine
src/lib/actions.ts                All writes (server actions)
src/lib/translit.ts               Devanagari ⇄ Latin + search skeletons
src/lib/storage.ts                Postgres-or-Blob storage adapter
src/lib/i18n.ts                   Locale, dictionary, bilingual fallback
src/lib/site.ts                   Environment-driven branding
src/scripts/                      setup / seed / reset
```
