# FK_LEARNING_1

Getting to know the programming world. Interested in app programming, augmented
reality, sustainability, transparency and the likes.

## Planning App V2

A personal planning system (Areas → Goals → Milestones → Tasks → Subtasks) that
**auto-saves to the cloud on every edit** — no manual sync — with a reliable
weekday morning email digest and direct Claude integration.

See [`planning-app/`](./planning-app):

| File | What it is |
|---|---|
| [`index.html`](./planning-app/index.html) | The app. Single file: login, all views, auto-save + realtime sync. |
| [`schema.sql`](./planning-app/schema.sql) | Supabase database schema, security, realtime. Run once. |
| [`SETUP.md`](./planning-app/SETUP.md) | Step-by-step go-live guide (Supabase + Hostinger + digest). |
| [`digest/SKILL.md`](./planning-app/digest/SKILL.md) | The cloud morning-email task — reads the live DB, not a local file. |

Start with **[`planning-app/SETUP.md`](./planning-app/SETUP.md)**.
