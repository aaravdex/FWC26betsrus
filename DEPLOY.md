# Deploying to Railway (public, shareable link)

This puts the app **and** its Postgres database on Railway and gives you a
permanent `https://<your-app>.up.railway.app` URL to share. People can then
register and log in from any device, any time.

The database auto-populates on first boot (48 teams, 56 fixtures, tournament +
top-scorer markets, and one admin) — **you don't run any seed command**.

---

## What's already set up for you

- `railway.json` — tells Railway to build with Nixpacks and start with
  `npm run start:railway`.
- `npm run start:railway` = `prisma migrate deploy` (creates tables) →
  `tsx prisma/bootstrap.ts` (loads markets if the DB is empty) → `next start`.
- `prisma` and `tsx` are runtime dependencies, so migrations/bootstrap work on
  the server.

---

## Option A — Deploy from GitHub (recommended, auto-redeploys on push)

1. **Push this project to a GitHub repo.**
   ```bash
   git push -u origin main         # after adding your GitHub remote
   ```

2. **Create the Railway project.**
   - Go to <https://railway.com> and sign in with GitHub.
   - **New Project → Deploy from GitHub repo →** pick this repo.
   - The first build may fail because there's no database yet — that's expected.

3. **Add Postgres.**
   - In the project: **New → Database → Add PostgreSQL.**

4. **Set variables on the app service** (the Next.js service, not the DB).
   Open the service → **Variables** → add:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the Postgres service) |
   | `STARTING_BALANCE` | `1000` |
   | `ADMIN_PASSWORD` | a strong password (this becomes the `admin` login) |

   Do **not** set `NODE_ENV` — Nixpacks needs devDependencies to build, and
   `next start` runs in production mode automatically.

5. **Redeploy.** Railway redeploys on the variable change. On boot it migrates,
   bootstraps the markets, and starts. Watch **Deploy Logs** for
   `[bootstrap] Done: 48 teams, 56 fixtures …`.

6. **Generate the public link.**
   - App service → **Settings → Networking → Public Networking → Generate Domain.**
   - You get `https://<name>.up.railway.app`. **This is the link you share.**
   - (Optional) add a variable `APP_URL` set to that URL and redeploy.

7. **Log in & lock it down.**
   - Visit `https://<name>.up.railway.app/login` → `admin` / your `ADMIN_PASSWORD`.
   - Admin → **Matches**: fill in real kickoff times.
   - Admin → **Accounts**: you can reset any player's password here (there's no
     email, so resets are admin-only).

Every `git push` to the connected branch re-deploys automatically.

---

## Option B — Deploy with the Railway CLI (no GitHub)

```bash
npm i -g @railway/cli
railway login
railway init                       # creates a new project
railway add --database postgres    # add Postgres
# set variables:
railway variables --set STARTING_BALANCE=1000 --set ADMIN_PASSWORD=<strong-pw>
#   and reference the DB:
railway variables --set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway up                         # build & deploy the current folder
railway domain                     # generate the public URL to share
```

---

## Notes

- **Play-money only.** No real currency, no payment integration.
- **Change `ADMIN_PASSWORD`** before sharing — don't ship the default.
- **Reset everything:** delete the Postgres service data (or drop the tables);
  the next boot re-bootstraps a fresh set of markets.
- **Demo data** (players/sample bets) is local-only via `SEED_DEMO=true` and is
  never created on a real deployment.
