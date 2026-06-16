# Planning App V2 — Deployment Handover

> **For:** a fresh Claude Code session that has **local access to Franziska's
> Mac** (filesystem + a Chrome/browser tool) and/or access to her
> **`franziskatueck-debug`** GitHub account and **Hostinger**.
> **From:** the web session that built the app.
> **Date:** 2026-06-16

---

## 0. TL;DR — what's left to do
The app is **built and working** (one bug was found and fixed). What remains is
purely **deployment + wiring**:
1. Put the code in a **private repo under `franziskatueck-debug`** (not the
   learning repo).
2. **Host `index.html` on Hostinger** (her own domain, behind login). **Not**
   GitHub Pages — privacy requirement.
3. In Supabase, **turn off "Confirm email"** so login is instant.
4. **Sign up / log in** in the app and verify auto-save + realtime.
5. **Connect Supabase to Claude** so Claude can write tasks directly.
6. **Create the scheduled digest task** (weekday 07:00 Europe/Zurich) from
   `digest/SKILL.md`, using the secret `service_role` key.

A non-technical user is driving. Be concrete, one step at a time. She is on
**macOS**, browser is **Chrome**.

---

## 1. What was built
A single-file web app that **auto-saves every edit to a cloud database** (no
manual "Sync"), with realtime cross-device sync, login, and a reliable morning
email digest. This replaces an older setup whose digest read a **local Mac file
path** (`/Users/franziskatueck/Documents/Planning/planning-app.html`) — which
the cloud scheduler couldn't reach, causing **intermittent, stale emails**. That
old skill lives in her Google Drive folder `daily-planning-digest` and should be
**retired** once the new one works.

### Files (currently at `FranziskaKlaus/FK_LEARNING_1`, branch `claude/zen-ptolemy-9mdeu9`, folder `planning-app/`)
| File | Purpose |
|---|---|
| `index.html` | The app. React 18 + Babel-standalone (no build step) + Supabase JS, all from CDN. Login, auto-save (debounced), realtime, views: Today / Overview / Goals / GoalDetail / Inbox / Areas. |
| `schema.sql` | Supabase schema — already run successfully. One `plans` table holding a JSON document per user, RLS, realtime, updated_at trigger. |
| `digest/SKILL.md` | The new cloud digest — reads the live DB (not a local file), has a health-check so emails never silently fail. |
| `SETUP.md` | End-user setup guide. |

> **Action:** copy the `planning-app/` folder into a **new private repo under
> `franziskatueck-debug`** (e.g. `planning-app`). The learning repo was only a
> scratch location.

### Data model (the JSON document in `plans.data`)
```
{ meta:{version,updatedAt,updatedBy},
  areas:[{id,name,emoji,color}],
  goals:[{id,areaId,title,description,deadline,status,
          milestones:[{id,title,deadline,
                       tasks:[{id,title,done,deadline,priority,notes,recurring,
                               gcalEventId,scheduledStart,scheduledEnd,
                               subtasks:[{id,title,done}]}]}]}],
  inbox:[{id,text,createdAt}],
  insights:{generatedAt,todayFocus,topPriorityIds,
            overloadAlert:{active,message},suggestedMoves:[],challenge} }
```
Seed = "start fresh": starter areas + two scaffold goals (MIRROR, Branding) with
empty task lists. See `SEED_PLAN` in `index.html`.

---

## 2. Supabase (already provisioned)
- **Org/account:** `franziskatueck-debug`
- **Project URL:** `https://mbuitwrlanjjgclgwdqs.supabase.co`
- **Project ref / ID:** `mbuitwrlanjjgclgwdqs`
- **anon public key** (safe to ship in client — RLS protects data):
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWl0d3JsYW5qamdjbGd3ZHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTUxMzcsImV4cCI6MjA5NzE5MTEzN30.WI1pgJqdqwys48E-HACdPdRRlim1eLg8dbk5bCmotnw
  ```
  Already hard-coded as `HARDCODED_URL` / `HARDCODED_ANON` at the top of the
  `<script>` in `index.html`.
- **service_role key:** NOT yet retrieved. Franziska must copy it from
  **Supabase → Project Settings → API → service_role**. It is **SECRET**:
  use it **only** in the scheduled-task settings and/or Claude's Supabase
  connection. **Never** commit it or put it in `index.html`.
- **schema.sql:** already run (table + RLS + realtime exist).
- **TODO:** Supabase → **Authentication → Sign In / Providers → Email** →
  turn **OFF "Confirm email"** (single user; makes first login instant).

---

## 3. The bug that was fixed (don't reintroduce)
Symptom: blank white screen, console error
`Uncaught SyntaxError: Cannot use import statement outside a module`
(from Babel's `transformScriptTags`).
Cause: in-browser Babel defaulted to the **automatic** JSX runtime, which injects
`import {jsx} from "react/jsx-runtime"` — invalid when executed as a classic
script.
Fix (already in `index.html`): register a classic-runtime preset and use it:
```html
<script>
  Babel.registerPreset('react-classic', {
    presets: [[Babel.availablePresets.react, { runtime: 'classic' }]]
  });
</script>
<script type="text/babel" data-presets="react-classic"> ... </script>
```
Also: do **not** run the app from a `file://` path (Chrome treats `file:` as a
unique security origin and blocks things — this is why local testing failed).
Always serve it over **https** (Hostinger).

---

## 4. Deploy to Hostinger (the destination)
1. Get `index.html` onto the Mac: on the GitHub file page, use the **"Download
   raw file"** button (down-arrow icon) so it saves as `index.html` (NOT via
   "Save As" on the raw view, which produces a `.txt`).
2. hPanel → her website → **File Manager** → open the web root (`public_html`,
   or the subdomain's folder). A subdomain like `plan.<herdomain>` is ideal.
3. **Upload `index.html`** there.
4. Open `https://<that-domain>/` (or `/index.html`). The **✦ Planning** login
   screen should appear (config is hard-coded, so no setup screen).
5. **Sign up** with her email + a password → log in → lands on **Today** with the
   two starter goals.

### Verify it actually works
- [ ] Login screen loads over https (no blank screen, no console errors).
- [ ] Sign up + log in succeeds.
- [ ] Add a task, tick it done → sidebar dot shows "Saving… → All changes saved".
- [ ] Open the same URL in a 2nd tab → the change appears live (realtime).
- [ ] Reload → data persists (it's in Supabase, not just the browser).

---

## 5. Connect Claude to the database
Goal: Franziska throws tasks at Claude in chat → they appear in the app.
- Connect the **Supabase integration** to Claude for project
  `mbuitwrlanjjgclgwdqs` (service_role key).
- Find her **user id**: Supabase → Authentication → Users → her row → copy the
  `id` (uuid). Claude reads/writes the single row:
  `select data from plans where user_id = <USER_ID>` and writes back the modified
  JSON document (set `updated_by='claude'`). The app's realtime subscription
  will reflect Claude's writes instantly.

---

## 6. The morning email digest
- Source of truth: `planning-app/digest/SKILL.md` (in this repo). It reads the
  **live DB**, computes overdue/today/top-priorities in **Europe/Zurich**,
  composes a mobile-friendly HTML email, **sends** (not draft) to
  `franziska.tueck@gmail.com`, then writes refreshed `insights` back to the DB.
- Recreate it as a scheduled task with secrets:
  `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (service_role), `USER_ID`, `APP_URL`.
- Schedule: **Mon–Fri 07:00 Europe/Zurich**.
- It has a **health-check**: if the DB can't be read, it still sends a short
  "couldn't reach your planner" email — so silence always means a real bug.
- **Retire** the old `daily-planning-digest` skill in Google Drive (the one that
  reads the local `.html` path) to stop stale/duplicate emails.

---

## 7. Privacy requirements (explicit user ask)
- The app must be **behind login** (Supabase Auth) — it is.
- **Do NOT use GitHub Pages** (forces a public page). Host on her **own
  Hostinger domain**.
- Keep the **GitHub repo private** (under `franziskatueck-debug`).
- **Never** commit the `service_role` key, personal task data, or any export.
  The anon key in `index.html` is the only key that belongs client-side and is
  safe by design (RLS).

---

## 8. Calendar (Google) — later phase, not blocking
She uses **Google Calendar**. A session with the Google Calendar tools can build
the bidirectional sync described in the original V2 plan (tool-created events are
draggable and sync back; external events read-only; pull-on-open updates task
times). The schema already carries `gcalEventId / scheduledStart / scheduledEnd`
per task. Not required for go-live.

## 9. Not yet built (backlog, from the V2 plan / handover)
- Drag-and-drop CalendarPlanner + true bidirectional GCal sync
- Bulk reschedule for overdue tasks
- Undo (toast-based)
- Recurring tasks
- Reply-to-email → add task

---

## 10. One-line status
**Built & debugged; needs hosting on Hostinger under `franziskatueck-debug`,
Supabase email-confirm turned off, login verified, Claude+Supabase connected,
and the weekday digest scheduled.**
