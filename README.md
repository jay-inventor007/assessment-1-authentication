# Authentication Slice

A minimal authentication flow: create an account, verify it by email, sign in, sign out, and reset a forgotten password. Built with React and TypeScript on the frontend, Supabase Postgres and Edge Functions on the backend.

See `DOCUMENTATION.md` for the full write-up: setup steps, the request flow, the data model, and the concepts behind the implementation.

## Quick start

```
npm install
cp .env.example .env   # fill in VITE_API_BASE_URL
npm run dev
```

Full setup, including linking the Supabase project and deploying the Edge Functions, is in `DOCUMENTATION.md`.
