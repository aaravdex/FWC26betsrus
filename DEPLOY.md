# Deploying (free) — Vercel + Neon

This hosts the app on **Vercel** and its Postgres database on **Neon** — both
have free plans, and Vercel doesn't sleep, so your link is always fast. You get
a permanent `https://<your-app>.vercel.app` URL to share.

The database **sets itself up on deploy**: the build runs migrations and loads
the 48 teams, 56 fixtures and all odds + one admin account. You don't run any
seed command.

---

## Step 1 — Create a free database (Neon)

1. Go to <https://neon.tech> and sign up (you can use your GitHub account).
2. Create a project (any name). Neon makes a database for you.
3. On the project page, find the **connection string**. Turn **Connection
   pooling OFF** so you get the *direct* string, then **copy** it. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2 — Deploy the app (Vercel)

1. Go to <https://vercel.com> and sign up with **GitHub**.
2. **Add New… → Project →** import the **FWC26betsrus** repo.
3. Before clicking Deploy, open **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon string from Step 1 |
   | `ADMIN_PASSWORD` | a password you choose (your admin login) |
   | `STARTING_BALANCE` | `1000` (optional) |
4. Click **Deploy** and wait ~2 minutes. The build creates the tables and loads
   all the teams/fixtures/odds automatically (watch for
   `[bootstrap] Done: 48 teams, 56 fixtures …` in the build log).
5. When it finishes, Vercel shows your live URL —
   `https://fwc26betsrus.vercel.app` (or similar). **That's the link you share.**

## Step 3 — Log in & finish setup

- Visit `https://<your-url>/login` → sign in as `admin` / your `ADMIN_PASSWORD`.
- Admin → **Matches**: fill in real kickoff times.
- Admin → **Accounts**: reset any player's password if needed (there's no email,
  so resets are admin-only).

Every `git push` to GitHub auto-redeploys.

---

## Notes

- **Free.** Vercel Hobby + Neon free tier — no card required.
- **Play-money only.** No real currency, no payments.
- **Reset everything:** in Neon, reset/recreate the database; the next deploy
  re-loads a fresh set of markets.
- **Connections:** the direct Neon string is simplest and fine for a small
  group. If you ever get connection-limit errors under heavy traffic, switch
  `DATABASE_URL` to Neon's *pooled* string.

---

## Alternative: Railway (paid, ~$5/mo, all-in-one)

`railway.json` is included if you prefer Railway (it bundles app + Postgres and
uses `npm run start:railway`). Steps: New Project → deploy this repo → add
PostgreSQL → set `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `ADMIN_PASSWORD`,
`STARTING_BALANCE=1000` → Settings → Networking → Generate Domain.
