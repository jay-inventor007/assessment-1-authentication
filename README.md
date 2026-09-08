# Assessment 1 — The Authentication Slice

React + TypeScript frontend, custom auth backend on Supabase Postgres +
Edge Functions (not Supabase's built-in Auth — see `../CLAUDE.md`). See
`../four_build_assessments (1).pdf` (pages 5-7) for the full brief.

Self-contained: this folder gets its own `git init` and its own GitHub repo
when it's ready to submit. Nothing here depends on code outside this folder.

## Current status

Linked to a live Supabase project ("Assesment DB", ref `doionclqsqrnshlqrvku`),
migrations pushed, all 8 functions deployed. Every behavior in the brief has
been exercised end-to-end via curl and confirmed working:

- Signup creates a user, hashes the password, sends a real verification
  email (Brevo HTTP API)
- Two concurrent signups for the same email produced exactly one account
  (idempotency, including the race-condition path)
- verify-email consumes the code and starts a session; resend-verification
  respects the 60s cooldown
- Signin works with the real password, rejects the wrong one and the
  pre-verification state correctly (401 vs 403)
- Signin's rate limit (10/5min) triggers a clean 429 with an honest,
  counting-down `Retry-After` header
- forgot-password -> reset-password: single-use token (reuse rejected with
  400), old password stops working, and — importantly — every existing
  session for that user is revoked by the reset, not just the current one
- signout clears the cookie and revokes the session server-side; `/me`
  correctly 401s both for no session and for a signed-out one

Two real bugs were found and fixed along the way (both worth writing up in
Section 6 — see below).

Built so far:

- DB schema: `users`, `verification_codes`, `password_reset_tokens`,
  `sessions`, `rate_limit_attempts` (`supabase/migrations/`)
- `check_rate_limit` Postgres function, shared by every rate-limited route
- 8 Edge Functions: `signup`, `signin`, `verify-email`,
  `resend-verification`, `forgot-password`, `reset-password`, `signout`, `me`
  — all deployed with `verify_jwt = false` (see `supabase/config.toml`),
  since none of them use Supabase's own JWT auth
- Frontend screens for all of the above, plus a protected `/dashboard`
- Email sending via Brevo's HTTP API (`supabase/functions/_shared/email.ts`),
  with a console-log fallback when no API key is set. A real SMTP relay
  connection was tried first and failed with a 503 before the function's
  own code even ran — Supabase Edge Functions don't reliably support raw
  outbound TCP/SMTP, only HTTP(S) `fetch()` — so this switched to Brevo's
  HTTP API instead. Worth writing up in Section 6.

Email is fully working (Brevo HTTP API, verified end-to-end to a real inbox).
The unused `SMTP_HOST`/`SMTP_USERNAME`/`SMTP_PASSWORD` secrets from the
earlier SMTP attempt can be removed whenever:
`npx supabase secrets unset SMTP_HOST SMTP_USERNAME SMTP_PASSWORD`.

## What's left before this is submittable

Everything functional is done and verified. What remains is entirely the
documentation and evidence-gathering work that has to be yours:

1. Capture the required screenshots/curl output for the brief's "Prove it
   works" list — a stored hash in the `users` table, a verification code
   before/after expiry, evidence of the 429 rate limit, etc. Most of the
   curl commands used above can be reused directly for this.
2. Write `DOCUMENTATION.md` yourself, in your own words, following the
   8-section structure in `../CLAUDE.md`. Section 6 ("What Went Wrong")
   already has real material to draw on:
   - The `verify_jwt` gateway rejection (signup returned 401 before
     reaching our code at all, because Supabase requires a JWT by default)
   - SMTP vs HTTP API for email: a real SMTP relay connection returned a
     503 before the function's own code ran at all (`x-served-by:
     base/server` instead of `supabase-edge-runtime`) — Supabase Edge
     Functions don't reliably support raw outbound TCP, only HTTP(S)
     `fetch()`, so this switched providers' send methods, not providers
   - An empty `SMTP_USERNAME` secret (silently falsy in JS) caused the
     app to take its safe fallback path with no error for several test
     rounds — worth writing up alongside why the fallback exists at all
3. Test the actual UI in a browser yourself (`npm run dev`) — everything
   above was tested via curl hitting the deployed functions directly,
   which is real evidence of the backend but isn't the same as confirming
   the React screens and their client-side validation work.

Re-run `npx supabase functions deploy` after any Edge Function code change —
deploys aren't automatic.

## Running it locally

```
npm install
npm run dev
```

Opens at http://localhost:5173. Requires `.env` to be filled in (step 5
above) or API calls will fail.
