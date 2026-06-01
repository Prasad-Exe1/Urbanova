# Urbanova — Hyderabad metropolitan marketplace

This repo implements the **Urbanova.** SPA — branded real estate tooling for Hyderabad’s metro corridors.

- GHMC core, **Secunderabad / Cyberabad** tech belts  
- Outer Ring (**ORR**) growth neighbourhoods  
- Peri‑urban **Ranga Reddy**, **Medchal**, and **Sangareddy** style corridors aligned with plausible **500xxx / 501xxx** postal bands  

The **public catalogue** defaults to **Hyderabad‑metro‑scoped listings** on `GET /api/properties`. Administrators can retrieve the **full Supabase table** with `GET /api/properties?scope=all` and a valid admin JWT (`token: Bearer …` header).

---

## Monorepo layout

At the repo root you only keep **`client/`**, **`server/`**, **`sql/`**, plus **`README.md`** and **`.gitignore`**. There is **no** package manifest at the root.

All orchestration (**`npm run dev`** for Express + Vite, **`npm run setup`**, **`npm run verify`**, smoke tests, etc.) lives in **[`server/package.json`](server/package.json)** — run npm commands **`cd server`** first (`node_modules` for the API and tooling live under **`server/node_modules`**; **`client/node_modules`** is separate).

```
real-estate-platform/
├── client/          React 19 · Vite 7 · React Router · package.json here (frontend only)
├── server/          Express 5 · Supabase JWT · uploads/ · package.json carries monorepo scripts
│   └── scripts/     setup.ps1, checkEnv.js, OpenRouter smoke test, one-off DB helpers
├── sql/             Schema (`schema.sql`) + migrations & Supabase helpers
└── README.md
```

Optional dev-only: open `server/scripts/openrouter-key-tester.html` in a browser to probe an OpenRouter key (same as **`cd server` → `npm run smoke:openrouter`**).

---

## Prerequisites

- **Node.js** 18+
- **Supabase** project (`SUPABASE_URL` or `VITE_SUPABASE_URL`, plus `SUPABASE_SERVICE_ROLE_KEY` for server inserts or permissive dev RLS — see [`server/scripts/checkEnv.js`](server/scripts/checkEnv.js))
- **`server/config/supabase.js`** uses **`SUPABASE_SERVICE_ROLE_KEY`** when set, otherwise **`VITE_SUPABASE_PUBLISHABLE_KEY`**; URL from **`SUPABASE_URL`** or **`VITE_SUPABASE_URL`**.

Optional:

- **`OPENROUTER_API_KEY`** — `/api/ai/chat` & `/api/ai/negotiate` (otherwise those routes return HTTP 503)
- **`OPENROUTER_SITE_URL`** — public SPA origin passed to OpenRouter as `HTTP-Referer` (defaults to `http://localhost:5173`)
- **`NOMINATIM_CONTACT_EMAIL`** — respectful usage of OSM Nominatim for geo tooling

---

## Quick start

**Windows (recommended) — installs `server/` + `client/` deps:**

```powershell
powershell -ExecutionPolicy Bypass -File server/scripts/setup.ps1
```

**Manual:**

```powershell
cd server
npm install
npm install --prefix ../client
```

Create **`server/.env`** (the setup script can copy **`server/.env.example`** when present). Then from **`server/`**:

```powershell
npm run check:env
npm run dev
```

| Service | URL |
|---------|-----|
| API | **`PORT`** in `server/.env` (default **5000**) |
| Vite SPA | http://localhost:5173 (or next free port — **proxy** forwards `/api` & `/uploads` to that same API port) |

---

## Production

After a successful client build, Express serves **`client/dist`** and **`/uploads`** when **`NODE_ENV=production`** and **`client/dist/index.html`** exists.

```powershell
cd server
npm run verify
$env:NODE_ENV = "production"
npm start
```

Then visit **http://localhost:5000** or whatever **`PORT`** is in `server/.env`. Omit `NODE_ENV=production` for API-only smoke tests — **`/`** then returns plain text instead of the SPA.

---

## Hyderabad demo seed

Upsert fourteen curated **Hyderabad‑locality** placeholders (repeatable):

```bash
cd server && npm run seed:hyderabad
```

Requires DB columns per **`sql/migrate_hyderabad_geo_feed.sql`** for `external_id`, `source`, geo fields (`upsert` on `external_id`).

Admin UI can also mint additional **metro-only demos** via *Generate Properties* (templates are **Greater Hyderabad**, not statewide).

---

## Notable HTTP routes

- **Public catalogue (metro‑filtered):** `GET /api/properties`
- **Full catalogue (admin):** `GET /api/properties?scope=all` + admin `token`
- Single listing: `GET /api/properties/:uuid`
- Auth: `/api/auth/*`
- Hyderabad geo / enrichment: `/api/geo/*`
- Assistant: `/api/ai/chat`, `/api/ai/negotiate`

---

## Front-end routes

`/`, `/properties`, `/property/:id`, `/add`, `/seller`, marketing pages, `/bvy-estate` → `/admin`, `/api-test`.

---

## Legal / product reality

Demo listings use illustrative **Hyderabad-linked** Wikimedia Commons photography (with optional `image_credit` when that column exists). Verified live inventory should use **your own** media plus consent and any **RERA / regional** disclaimers for your jurisdictions; persist provenance via **`source`** / **`external_id`**.

---

## Contributing workflow

From repo root, lint + build the SPA:

```bash
cd server && npm run verify
```

Or manually: `cd client && npm run lint && npm run build`

### Windows build: `EBUSY` / file locked

If `vite build` fails while copying into `client/dist` (often `vite.svg`), close any Explorer windows on **`client/dist`**, stop **`vite preview`** / other tools using that folder, and retry. Temporarily pausing real-time antivirus scans for the repo can also help.

---

Urbanova HYDERABAD scope is enforced in **`server/routes/properties.js`** via `HYDERABAD_METRO_OR`. Adjust predicates there if your commercial definition of “metro” evolves.
