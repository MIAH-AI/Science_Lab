# Licensing and deployment

## License

A license is a record signed by the control service:

- school and campus
- status: `trial`, `active`, `suspended`, or `expired`
- start and end dates
- seat cap
- grace period in days
- machine fingerprint it is bound to

The campus app verifies the signature with the Plysoft public key built into the release. A license edited on the server fails verification.

## Three-month test term

A test term is a `trial` license that ends three months after it starts.

1. The Plysoft Tech Team creates the trial in the console with a seat cap.
2. The campus runs normally for the term.
3. When the end date passes, the app becomes read-only for the grace period so teachers can export results.
4. After the grace period it locks until the license is extended or converted to `active`.

## Seat cap

- Seats count approved users (`active` status) on a campus.
- The school admin cannot approve a user past the cap. The server rejects it.
- The agent reports the approved count on every heartbeat, and the console shows it next to the cap.
- Disabling a user frees a seat.

## Enrollment and first install

1. The Plysoft Tech Team creates the campus deployment in the console. The console issues a one-time enrollment token.
2. Campus IT runs the installer on the campus server with that token.
3. The agent fingerprints the machine and enrolls with the control service.
4. The control service binds the license to that fingerprint and returns the signed license and keys.
5. The agent pulls the signed release image, verifies it, starts the campus app, and reports `enrolled`.

The token works once and expires after a short time.

## Releases: scheduled pull by the campus agent

Updates are pulled by the campus agent and installed on a schedule set per campus. Nothing connects into the school network.

1. The Plysoft Tech Team publishes a signed release and chooses a rollout: which campuses (all, a pilot campus first, or a named list), when (a date and time, a weekly window, or the next school holiday), the release track (pilot or stable), and urgency (normal or security fix).
2. The control service queues a release job per campus.
3. On its next check-in the agent receives the job, downloads the image early, and verifies the signature and digest.
4. The agent waits until the campus maintenance window, outside blackout dates. Urgent security fixes skip the window but never install during class hours.
5. Inside the window the agent backs up the database and switches to the new version.
6. The agent runs a health check for a few minutes. If the new version is not healthy, it rolls back automatically.
7. The agent reports `downloaded`, `installing`, `installed`, `failed`, or `rolled_back`, and the console shows each campus's version.

Database migrations run during the switch and must be reversible.

### Per-campus scheduling settings

| Setting | Example |
| --- | --- |
| Maintenance window | Every Sunday, 01:00–04:00 campus time |
| Blackout dates | Exam weeks, the first week of term |
| Postponing | The school admin can postpone once, for up to 7 days |
| Security override | Critical fixes skip the window but never install during class hours |

Changing the window changes the interval: daily, weekly, monthly, or one-off, with no one on site.

### Other delivery options considered

| Option | Why it is not the default |
| --- | --- |
| Push over SSH (for example, Ansible) | Needs inbound access to each school server |
| Outbound VPN, then push | Keeps a live connection into every school network |
| Containers with an auto-updater only | Lacks maintenance windows, licensing, and reporting on its own; used underneath the agent |
| Managed fleet service (Balena, Mender, AWS Systems Manager, Azure Arc) | Per-server cost and a third party in every school |
| Operating system packages | One operating system only, weak rollback and reporting |
| Offline bundle (USB) | Kept as the fallback for campuses with no outbound access |

## Building the campus agent

| Option | Summary |
| --- | --- |
| Option 1 (recommended): Go | One self-contained program for Linux and Windows, mature TLS, TPM, TUF, and container libraries, harder to read or modify on the server |
| Option 2: TypeScript on Node.js | Same language as the app and control service; packaged as one program with a bundled runtime. Suitable for the pilot, rewritten in Go before more campuses |

The agent's jobs are listed in [README.md](./README.md#7-campus-agent).

## Remote suspension

1. The Plysoft Tech Team suspends a campus in the console.
2. On the next heartbeat the agent receives `suspended` and stops renewing keys.
3. The campus app locks and drops its keys from memory.

If the server cannot reach the control service, the app keeps running for the grace period, then locks. This prevents a short outage from stopping lessons, and it means blocking the outbound connection does not avoid suspension for long.

## Campuses without outbound access

If a campus server cannot reach the internet at all, IT carries a signed license file and release image to it. The file has a hard expiry. Remote suspension then waits until that file expires. Prefer requiring outbound HTTPS to the control service for every trial and paid deployment.

## What the console shows per campus

- license status, end date, and days left
- seat cap and approved seats
- current version and pending release jobs
- last heartbeat and health
- lock state
