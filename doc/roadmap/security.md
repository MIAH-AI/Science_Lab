# Security

## Threat model

A person with administrator rights on the campus server can copy disks and read process memory. No software design fully stops that person. The goal is to make casual access fail, make copied installations useless, and make leaks traceable, then back it with the contract.

| Threat | Control |
| --- | --- |
| IT copies the install to another machine | License and keys are bound to the machine fingerprint. A copy never receives a key |
| IT opens the database file | The database and backups are encrypted. The key is not stored in config or backups |
| IT edits the license to raise seats or extend the term | Licenses are signed. An edited license fails verification |
| Someone blocks the outbound connection to avoid suspension | Keys are short-lived. The app locks after the grace period without renewal |
| A tampered release is installed | The agent verifies the image signature and digest before installing |
| Leaked content or code appears elsewhere | Each deployment's content and database are watermarked with the campus id |
| Students reach another student's data | Server-side role and scope checks on every request |
| Public users reach school data | Separate accounts and databases. No shared sign-in |
| Forged or replayed activity events | Events are signed with the campus deployment key, carry unique ids, and are rejected from unknown or suspended deployments |
| Central activity data identifies students | Campus-specific pseudonymous codes by default. Identities only with the school's agreement |

## Database encryption

- Encrypt the campus database file and every backup.
- The control service releases the database key only to a valid license on the bound fingerprint.
- Hold the key in memory and in the operating system key store for the grace period. Never write it to the app config, environment files, or backups.
- Give campus IT an operator role: start, stop, disk space, and encrypted backup files. Do not give them a database password or a query console.
- Log every service restart, backup, and restore to the audit log and report it on the heartbeat.

A determined administrator who dumps the running process can still read the key. Cover that with the contract and the audit trail.

## Protecting code and content

- Ship the campus app as a signed image, not source.
- Strip source maps and development tooling from the campus build.
- Encrypt lesson and simulation bundles at rest. Decrypt them with the short-lived content key.
- Watermark each campus build so a leaked copy can be traced to its campus.
- Contract terms: no image export, no key extraction, no reverse engineering, and the right to audit.

## Authentication

- Campus: passwords hashed with a modern algorithm (Argon2 or bcrypt), sessions bound to the campus, lockout after repeated failed sign-ins.
- Public: a managed authentication provider, with email verification and password reset.
- Platform console: strong authentication with a second factor for every Plysoft Tech Team member.

## Transport

- The agent talks to the control service over HTTPS and pins the control service certificate.
- The campus app serves HTTPS on the local network using a certificate issued at enrollment.

## Privacy

- The campus server is the source of truth for student records.
- Live activity events reach the central activity database. By default user identities are replaced with campus-specific codes that only the campus server can resolve. Sending identities requires the school's written agreement. See [realtime-activity.md](./realtime-activity.md).
- Summaries sent to the cloud contain aggregates only.
- Platform admins do not read campus learner records. Plysoft staff access to the central activity database is limited to named roles and logged.
- Agree data retention and deletion terms with each school before the pilot, covering both the campus database and the central activity database.
