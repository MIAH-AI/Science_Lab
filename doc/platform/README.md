# Platform build notes

Hand-over notes for the platform track (accounts, console, licences, school servers). The requirements are in [doc/roadmap](../roadmap/README.md); these notes say what has been built against them, the choices made on the way, and what is still open. Each phase is one pull request.

| Phase                                                    | Pull request branch           | State                                 |
| -------------------------------------------------------- | ----------------------------- | ------------------------------------- |
| 2. Platform admin console and licences                   | `platform/2-console-licences` | Built, tested. Off unless switched on |
| 3. School server: licence check, enrolment, heartbeat    | `platform/3-school-server`    | See [phase-3.md](phase-3.md)          |
| 4. School accounts: invite codes, approval, seats, roles | `platform/4-school-accounts`  | See [phase-4.md](phase-4.md)          |

Someone else on the team is also working on this track. Nothing here is merged to `main`; treat it as a working proposal to merge with, or lift from.

## Phase 2: console and licences

### What a platform admin can do

- Create the first admin account with a one-time setup key, then invite more admins by one-time link.
- Sign in with a password and a 6-digit authenticator code. Five wrong tries lock the account for 15 minutes.
- Add schools and campuses. Set each school's term length (default 3 months) and read-only period (default 14 days).
- Issue a trial or full licence for a campus: one term, two terms, or an exact end date, with a seat count. Extending is issuing a new licence; earlier ones stay in the history.
- Download or copy the signed licence file.
- Suspend a campus with a reason, and lift the suspension.
- Make a one-time enrolment code for a school server, and see each server's last contact, version and seats in use.
- Read the audit trail of everything done in the console.

### Where things are

| Path                                         | What                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/server/licence.ts`                      | Licence format, Ed25519 signing and checking, and `standing()` (valid, read-only, locked) |
| `src/lib/terms.ts`                           | Date maths shared with the console forms                                                  |
| `src/server/secrets.ts`                      | Argon2id passwords, authenticator codes (TOTP), random tokens                             |
| `src/server/admins.ts`                       | Platform admins, invites, sign-in, sessions, lockout, audit                               |
| `src/server/control.ts`                      | Schools, campuses, licences, suspension, enrolment, heartbeat                             |
| `src/server/db.ts`, `schema.ts`              | Database access and migrations                                                            |
| `src/console/api.ts`                         | Server functions; each one checks the caller on the server                                |
| `src/console/Console.tsx`, `src/console.css` | The screens                                                                               |
| `src/routes/console*.tsx`                    | Routes under `/console`                                                                   |
| `src/routes/api.campus.*.ts`                 | `POST /api/campus/enrol` and `POST /api/campus/heartbeat`                                 |
| `tools/make-licence-key.mjs`                 | Makes the signing key pair                                                                |

### Settings

| Setting               | Purpose                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `CONSOLE_ENABLED=1`   | Turns the console on. Without it `/console` and the two API addresses answer "not found" |
| `CONSOLE_SETUP_KEY`   | Typed once to create the first admin. Remove it afterwards                               |
| `LICENCE_SIGNING_KEY` | Ed25519 private key (PEM or base64 of the PEM). Control service only                     |
| `LICENCE_PUBLIC_KEY`  | Matching public key. Control service and every school server                             |
| `DATABASE_URL`        | Postgres (Netlify DB). Required online                                                   |
| `DATA_DIR`            | Folder for the embedded database when there is no `DATABASE_URL` (default `.data`)       |

### Run it locally

```sh
node tools/make-licence-key.mjs ~/t2s-keys
pnpm build
CONSOLE_ENABLED=1 CONSOLE_SETUP_KEY=choose-one \
  LICENCE_SIGNING_KEY="$(cat ~/t2s-keys/licence-private.pem)" \
  LICENCE_PUBLIC_KEY="$(cat ~/t2s-keys/licence-public.pem)" \
  npx vite preview --port 4811
```

Open `http://localhost:4811/console`.

### To switch it on online

1. Enable Netlify DB for the site, which sets `NETLIFY_DATABASE_URL`. The tables are created on first use.
2. Run `tools/make-licence-key.mjs` on a trusted computer. Put the private key in `LICENCE_SIGNING_KEY` and the public key in `LICENCE_PUBLIC_KEY`, both scoped to Functions. Keep an offline copy of the private key.
3. Set `CONSOLE_SETUP_KEY` to a long random value and `CONSOLE_ENABLED=1`, then redeploy.
4. Open `/console`, create the first admin, then delete `CONSOLE_SETUP_KEY`.

### Choices, and where they differ from the roadmap

- **One SQL dialect.** Online the database is Postgres (Netlify DB). For local work, tests and school servers it is PGlite, the same engine embedded in the app, so no database has to be installed on a school's server. The roadmap does not name a database. If the team prefers a full Postgres server on campus, only `src/server/db.ts` changes.
- **Our own sign-in.** The product owner chose this over an outside provider because school servers run offline. Passwords are Argon2id through Node's built-in `crypto.argon2` (Node 24.7 or later), so there is no native dependency (SEC-6).
- **Second factor.** Every console account uses an authenticator app (SEC-7). A code cannot be used twice.
- **Licence format.** `T2S1.<payload>.<signature>`, base64url JSON signed with Ed25519. The fields follow "License" in `licensing-and-deployment.md`. `status` is not stored in the licence: trial or active is `kind`, expired comes from the dates, and suspended comes from the control service.
- **Per-school terms.** The roadmap fixes a three-month test term. The product owner asked for 3 months plus 14 days as the default, changeable per school, and the console also takes an exact end date.
- **Suspension reaches a server only when it is online.** The heartbeat answer carries a signed note. A server that never connects runs until its licence's end date, which is the hard limit. This matches the roadmap's "without it, remote suspension cannot be guaranteed".
- **Spelling.** Code and screens say "licence" (British). The roadmap says "license".

### Checked

- Unit and integration tests against a real embedded Postgres: `pnpm test` (`src/server/*.test.ts`).
- Browser journeys through the whole console, with nothing mocked: first-time setup, wrong key and wrong code, issuing and extending, a downloaded licence verified with the public key, a tampered file failing, a request replayed with no session refused, a cross-site request refused, a server enrolling and reporting in, invite and disable, audit trail, lockout, and the console answering "not found" when switched off.

### Not done yet

- No email is sent. Invite links are shown for the admin to pass on.
- No password reset for admins; another admin disables the account and invites the person again.
- No lost-authenticator recovery codes.
- No key rotation. Changing the signing key means a new package for every school server.
- No limit on requests per network address, only per account.
- Release publishing and scheduled updates (the "Releases" section of the roadmap) are not started.
- Live activity ingest and dashboards are not started.
