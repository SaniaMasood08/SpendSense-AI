# SpendSense AI

SpendSense is a personal expense dashboard built with Next.js, TypeScript, and Recharts. Supabase Auth manages account credentials; Supabase Postgres stores transactions and budgets in owner-scoped tables protected by Row Level Security (RLS). Passwords are sent only to Supabase Auth and are never stored by this app.

## One-time Supabase setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor**, create a query, paste in [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the transactions and budgets tables and their ownership policies.
3. In **Project Settings → API**, copy the **Project URL** and the publishable/anon key. Never use or expose a `service_role` key in this app.
4. Copy `.env.example` to `.env.local` and fill in the two values:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. In **Authentication → URL Configuration**, set the site URL to `http://localhost:3000` for local development. Add your deployed site URL when deploying.
6. For email-confirmation signups, configure Supabase email delivery and confirm the registration link before logging in. You can adjust email confirmation under **Authentication → Providers → Email**.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and log in. A new account has no transactions or budgets until you add them.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Data and account isolation

The Supabase Auth service validates registration and login credentials. The app keeps the issued access/refresh token session in browser storage so the account remains signed in; it does not store passwords. Financial records live in Supabase Postgres. Every record has a `user_id`, and RLS policies require it to match the authenticated Supabase user for reads, inserts, edits, and deletes. The public anon key is intended for browser use; RLS is the data access boundary. Never add a service-role key to `.env.local` or client code.

Custom categories are stored on that user's transaction and budget records. Built-in categories remain the existing app-wide choices. Data previously stored in the old unscoped localStorage dashboard is not imported into an account, because the app cannot safely determine which account owns it. Export or back up any records you still need before switching.
