# Zero-cost deploy (Neon + Render + Vercel)

## 1. Neon (Postgres) — free
1. https://console.neon.tech → sign up (GitHub OK)
2. Create project `cic-dd2`
3. Copy the connection string (**pooled** URI is fine)
4. Keep it for Render `DATABASE_URL`

## 2. Push this repo to GitHub
Code must be on GitHub for Render/Vercel.

## 3. Render (API) — free
1. https://dashboard.render.com → **New** → **Blueprint**
2. Connect this GitHub repo
3. Apply `render.yaml` → service `cic-dd2-api`
4. In Environment, set:
   - `DATABASE_URL` = Neon URI
   - `FRONTEND_URL` = your Vercel URL (set after step 4, then redeploy/save)
5. Wait until `/api/health` returns `{ ok: true }`
6. Note public URL, e.g. `https://cic-dd2-api.onrender.com`

## 4. Vercel (PWA) — free
```bash
cd frontend
vercel --prod
```
Set env var:
- `VITE_API_ORIGIN` = `https://cic-dd2-api.onrender.com` (no trailing slash)

Then rebuild/redeploy so the client embeds the API URL.

## 5. Seed a demo user (optional)
From a machine with `DATABASE_URL` pointing at Neon:
```bash
cd backend
DATABASE_URL="postgres://..." DATABASE_SSL=true node scripts/seedLocalDemo.js
```
Login: `demo.participant@cic.local` / `Demo@12345`

## Notes
- Free Render **sleeps** after idle; first request can take ~30–60s.
- Reminder emails need SMTP later; deep links work once `FRONTEND_URL` is set.
