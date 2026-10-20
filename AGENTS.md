# AGENTS.md

SnapNotes: an Express 5 + TypeScript API lives in `server/`; `client/` is empty (no code, no package.json). Not a git repo — no branch/commit/PR conventions exist. **Run every command from `server/`.**

## Commands

- `npm run dev` — `tsx watch src/server.ts`, port **4000** (`GET /`, `/api/v1/health`, `/api/v1/auth/*`)
- `npm run typecheck` — `tsc --noEmit`; toolchain is **TypeScript 7.0.2** (native tsc), Node 22
- `npm test` — `vitest run` (config `vitest.config.mts`); one file: `npx vitest run tests/auth.test.ts`; one case: `npx vitest run -t "logout clears"`
- `npm run generate` / `npm run migrate` — drizzle-kit; schema is the single file `src/db/schema.ts`, migrations land in `drizzle/<timestamp>_<name>/`
- `npm run build` → `dist/`, then `npm start` → `node dist/server.js`
- There is **no lint or formatter** — don't invent `npm run lint`.

Verify in order: `npm run typecheck` → `npm test`.

### Typecheck coverage gap
`tsconfig.json` sets `rootDir: ./src` and `include: ["./src/**/*.ts"]`, so `tests/`, `vitest.config.mts` and `drizzle.config.ts` are **never** typechecked by `npm run typecheck`, and adding them to `include` breaks `npm run build` (TS6059). To check one uncovered file:

```sh
npx tsc --noEmit --ignoreConfig --module nodenext --moduleResolution nodenext \
  --target esnext --strict --esModuleInterop --skipLibCheck --types node <file>
```

`--ignoreConfig` is mandatory: TS7 errors if a file path is passed while a tsconfig exists.

## Architecture

- **Feature modules**: `src/modules/<feature>/{<f>.routes,<f>.controller,<f>.service,<f>.schema,<f>.types}.ts`. Routers are declared *inside* the module and mounted only in `src/app.ts` (`/api/v1`, `/api/v1/auth`). Never create a top-level `routes/` dir — a duplicate one existed and was deleted.
- **Layer contract**: routes = wiring + `validate(schema)` + `requireAuth`; controllers own HTTP + cookies and never touch the DB; services are pure (no `express` imports) and throw `AppError`; zod schemas live in `<feature>.schema.ts` (never inline in services).
- **Errors**: `AppError(status, code, message)` and `ZodError` are handled by `src/middleware/errorHandler.ts` → `{"error":{code,message,details}}`; success bodies use `{"message", ...}`. Express 5 forwards rejected async handlers to the error handler — no `asyncHandler` wrapper needed.
- **Data**: `src/db/index.ts` (neon-http drizzle), `src/db/schema.ts` (source of truth for drizzle-kit), `src/db/queries/*.ts` (data access; services call queries, not `db` directly).
- **Shared**: `src/lib/` (AppError, logger, cookies, auth/jwt), `src/middleware/`, `src/config/env.ts`.
- Tables `users`, `notes`, `processing_jobs` already exist but only `auth` + `health` modules are implemented — copy the auth module shape for `notes`.

## Auth (cookies only)

- Tokens are never returned in bodies. `register`/`login` set httpOnly cookies via `src/lib/cookies.ts`: access `Path=/` (15 min), refresh `Path=/api/v1/auth` (7 days). Keep the refresh path exactly `/api/v1/auth` or the cookie stops being sent back.
- `requireAuth` reads the access cookie → 401 `unauthorized` when missing/invalid; `/auth/logout` is deliberately unguarded.
- `JWT_SECRET` and `JWT_ISSUER` are required env keys (the legacy name `TOKEN_ISSUER` was removed).

## Env and tests

- `.env` is gitignored; `.env.example` lists the keys. `src/config/env.ts` validates at import and `process.exit(1)`s — a missing var kills boot, not a request.
- `dotenv` runs first and never overrides vars already set, so vitest's `NODE_ENV=test`, `LOG_LEVEL=silent`, `JWT_*` win over `.env`; `DATABASE_URL` still comes from `.env`.
- `DATABASE_URL` must be a Neon **pooler** URL with `sslmode=require`; a bare URL fails at query time with "Wrong URL scheme or missing user, host or database".
- **Tests hit the real dev database** (no test DB, no mocks) and create real rows, so keep any new test data randomized (see the UUID suffix in `tests/auth.test.ts`).

## Shell gotcha

Kill the dev server with `pkill -f "[t]sx src/server.ts"` — the unbracketed pattern matches your own shell's command line and kills the session before anything runs.
