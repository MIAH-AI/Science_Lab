# Phase 4: school accounts

Branch `platform/4-school-accounts`, on top of phase 3. People at a licensed school can now have accounts on their school's server, and the school admin approves them within the seats on the licence. It covers the user lifecycle in [roles and permissions](../roadmap/roles-and-permissions.md) and ADM-3, ADM-5 and ADM-6. Tasks, class reports and the principal's and director's real screens are not built.

## What it does

- **First school admin.** The installer runs `cli.mjs admin "<name>"` on the server, which prints a one-time invite code. It works once, only from the server itself, and only when a licence is installed.
- **Invite codes, not email.** The school admin invites one person, or pastes a class list and gets a code for each name. Codes are eight easy-to-read characters (no 0, O, 1 or I), last 30 days, and can be printed or cancelled.
- **Joining.** At `/join` the person types their code, sees their name, and chooses a password. They get a username made from their name (`ada.obi`, then `ada.obi2`). Then they wait for approval.
- **Approval within the seat limit.** Approving uses a seat. When every seat on the licence is in use the approval is refused and the person stays waiting. The count and the change are one database statement, so two approvals at the same moment cannot go over.
- **Disable.** Frees the seat, ends the person's sessions at once and keeps their account and work. Enabling again needs a free seat.
- **Forgotten password.** The school admin makes a one-time new-password code. The old password and sessions stop at once; the account, username, approval and seat stay.
- **Sign-in** at `/signin` with username and password. Five wrong tries lock the account for 15 minutes. Sessions last 12 hours.
- **Roles.** Student, teacher, principal and school admin exist. Only the school admin can open People or change anyone; the server checks this on every call.
- **Read-only when the licence ends.** People shows a notice and its buttons are off, and the server refuses changes sent anyway.
- **Seats in use are reported** to the console on each check-in.
- **The labs stay open without an account** (CON-1). An account adds identity for the school tools that come next.
- **On the Study Desk** of a school server, a chip shows "Sign in", or the person's name with a way out and, for the admin, a link to People.

## Where things are

| Path                                                  | What                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/school/accounts.ts`                              | Invites, joining, approval, disable, sign-in, sessions                                                           |
| `src/school/schema.ts`                                | The school server's own tables                                                                                   |
| `src/school/api.ts`                                   | Server functions, each checking the caller and the licence                                                       |
| `src/school/School.tsx`, `src/school.css`             | Sign in, Join, People, and the Study Desk chip                                                                   |
| `src/routes/signin.tsx`, `join.tsx`, `app.people.tsx` | Routes. On the hosted site `/signin` and `/join` are "not found" and `/app/people` is still the sample-data demo |
| `src/routes/api.school.internal.ts`                   | Seat count and first-admin, callable only by the server process itself                                           |

## Checked

- Unit tests with a real embedded database, including two approvals at the same instant.
- Browser journeys on a real school server with three seats: installer makes the first admin; a second is refused; invite one and a class; join on a phone; sign-in refused before approval; seats fill; the next approval is refused; a student cannot open People; the admin's request replayed with a student's session, and with none, is refused; disable signs the teacher out at once; the freed seat is reused; a cancelled code stops working; a new-password code signs the student out and lets them choose a new password; read-only refuses changes in the page and on the server; lockout.
- The hosted build answers "not found" for `/signin` and `/join`.

## Limits to know about

- **Plain http on the school network.** School servers have no certificate, so the session cookie cannot be marked Secure and traffic on the school Wi-Fi is not encrypted. The roadmap's answer is a certificate from the school's own authority or a reverse proxy; neither is set up.
- **Invite codes are stored as written**, so the admin can read them again before they are used.
- **One campus per server.** Sessions are not separately bound to a campus id (SEC-6), because the database only ever holds one campus.
- **No classes as records.** "Class" is a label on a person. Teachers are not yet linked to the classes they teach.
- **Teacher, principal and director screens are still the sample-data demo** on the hosted site, and are not shown on a school server.
- **The database is not encrypted at rest.**
