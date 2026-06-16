# Planning App V2 — Setup

The rebuild that kills manual sync. Your app auto-saves every edit to a cloud
database; the morning digest reads that same database; Claude can write to it
directly. No "Sync" button, ever.

```
 phone / laptop browser ──▶  SUPABASE (one DB)  ◀──  daily digest (cloud email)
   auto-saves on edit            ▲
                                 └── Claude writes here (throw a task in chat)
```

## What you do once (≈15 minutes)

### 1. Create the database (Supabase — free, no card)
1. Go to https://supabase.com → sign up (free) → **New project**.
   Pick a name, a strong DB password, a region near you (e.g. Frankfurt).
2. When it's ready: **SQL Editor → New query** → paste all of
   [`schema.sql`](./schema.sql) → **Run**. (Creates the table, security, realtime.)
3. **Project Settings → API** — copy two values for later:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public** key (long `eyJ…` string) — safe to put in the app
   - **service_role** key (also `eyJ…`) — **secret**, only for the digest

### 2. Put the app online (Hostinger)
1. Upload [`index.html`](./index.html) to a folder on your Hostinger hosting
   (hPanel → File Manager, or FTP). A subdomain like `plan.yourdomain.com` is ideal.
2. Open the URL. On first run it asks for your **Project URL** + **anon key**
   (from step 1.3). Paste them — stored only in your browser.
   - _Optional:_ to skip that screen, set `HARDCODED_URL` / `HARDCODED_ANON`
     at the top of the `<script>` in `index.html` before uploading.
3. **Sign up** in the app with your email + a password → you're in. Your plan
   row is created automatically with the starter areas/goals (empty tasks).

> Tip: in Supabase → **Authentication → Providers → Email**, you can turn OFF
> "Confirm email" so login is instant for a single user.

### 3. Let Claude write to it
- Connect the **Supabase integration** to Claude (so "throw a task at Claude"
  updates the app instantly). Share the Project URL + service_role key with
  Claude when asked, and tell Claude your **user id** (Supabase →
  Authentication → Users → your row).

### 4. Turn on the reliable morning email
- The digest skill lives in [`digest/SKILL.md`](./digest/SKILL.md). Ask Claude to
  (re)create your scheduled task from it, providing `SUPABASE_URL`,
  `SUPABASE_SERVICE_KEY`, `USER_ID`, and your app URL. It runs **weekdays 07:00
  Europe/Zurich**, reads live data, and now sends *something every weekday* — so
  a missing email means a real bug, not silence.

## Going live checklist
- [ ] `schema.sql` run in Supabase
- [ ] `index.html` uploaded to Hostinger, opens over HTTPS
- [ ] Signed up + logged in; starter goals visible
- [ ] Edited a task on laptop → appears on phone (realtime works)
- [ ] Supabase connected to Claude; "add a test task" in chat appears in app
- [ ] Digest scheduled; sent a test run; email looks right

## Don't want Supabase? (alternative)
The whole front-end is backend-agnostic — it just needs somewhere to read/write
one JSON document. Because you already pay for **Hostinger**, the no-new-service
option is a tiny **PHP + MySQL** API on Hostinger (MySQL DB + ~40 lines of PHP
with GET/POST for the plan). Same app, same auto-save, zero extra subscription.
See the chat for the trade-offs; this is a clean swap of just the data layer.
