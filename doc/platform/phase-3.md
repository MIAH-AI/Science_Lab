# Phase 3: the school server

Branch `platform/3-school-server`, on top of phase 2. It turns the app into something that can be copied to a school's own server, checks its licence there, and reports in to the console when it has a connection. It does not yet have school accounts; that is phase 4.

## What it does

- **One package, nothing to download.** `pnpm build:campus && node tools/package-campus.mjs` makes `dist/tough2simple-school-<version>.tar.gz` (about 220 MB): the built app and labs, the server, its run-time packages, the public key and [INSTALL.md](INSTALL.md). The school's machine needs only Node 24. Unpacked into an empty folder and run with a bare environment, it serves the app.
- **Every page is behind the licence check**, the labs included, because one Node process (`dist/campus/server.mjs`) serves both the static files and the app.
  - No licence, not started, ended and past the read-only period, suspended, or made for another server: every address goes to `/licence`, which says why in plain words. Scripts and data are refused with 403.
  - Read-only period: everything opens, with a notice on every page.
  - Valid: normal.
- **`/licence` page**: where the licence stands, the server's fingerprint, and a form to install a licence file. Installing needs no sign-in, because only a licence signed by us, for this server and campus, and newer than the installed one is accepted.
- **Two ways to license a server.**
  - Online: `cli.mjs enrol <console address> <code>` with a one-time code from the console. The licence comes back tied to the machine, and the server then checks in every 15 minutes when it can.
  - Offline: the admin reads the fingerprint off `/licence`, the platform admin ties the campus to it in the console ("Tie to this server") and downloads the licence, and it is installed from the page or with `cli.mjs licence <file>`.
- **Check-ins** bring back an extended licence and a signed suspension note, and report the version. They fail quietly when there is no connection.
- **A trial may be installed before the server is tied down; a full licence must be made for the server.** This keeps a first pilot simple and stops a paid licence being copied to a second machine.
- **Turning the clock back gains nothing.** The server remembers the latest time it has seen and never counts from earlier. While it runs, that time moves forward with real elapsed time even if the wall clock is wrong. A check-in resets it to the control service's time.
- **On a school server the front door is the Study Desk.** The public front page, the sample-data demo and the platform console are not served.

## Where things are

| Path                                                 | What                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/campus/server.ts`                               | The server: static files, the app, the licence gate, the read-only notice, check-ins |
| `src/campus/standing.ts`                             | `campusStanding()`, `installLicence()` and the licence clock                         |
| `src/campus/store.ts`                                | Files in `DATA_DIR`, and the machine fingerprint                                     |
| `src/campus/heartbeat.ts`                            | `enrol()` and `beat()`                                                               |
| `src/campus/cli.ts`                                  | `fingerprint`, `status`, `licence <file>`, `enrol <address> <code>`                  |
| `src/campus/status.ts`, `src/routes/licence.tsx`     | The `/licence` page                                                                  |
| `src/server/control.ts` `tieToMachine()`             | Console side of the offline path                                                     |
| `tools/build-campus.mjs`, `tools/package-campus.mjs` | Build and package                                                                    |

## Checked

- Unit tests with a real embedded database: fingerprint, licence clock, every standing, refusals on install, enrol and check-in through the real control service code, an unsigned answer ignored.
- Browser journeys with a real school server process and a real console: closed when new; three kinds of bad licence refused; offline install; study desk and a lab open; restart keeps the licence; enrol from the command line; an extension, a suspension and its lifting arrive by check-in; read-only notice on the study desk and in a lab; locked; unlocked by an extension.
- The package was unpacked into an empty folder on macOS and run with nothing but Node.
- **Linux:** the package was installed in a clean Debian container with Node 24, following [INSTALL.md](INSTALL.md) step by step (apart from systemd, which a container does not have): unpack, service user, start, read the fingerprint from the system's machine id, install a licence made for it, open the study desk and a lab, stop with a normal stop request, start again and find the licence still there. The files in the data folder are readable only by the service user.
- Found on the way and fixed: the server ignored a normal stop request (the app bundle catches the signal), which would have made every restart hang.

## Limits to know about

- **A server that is switched off does not count time**, and a server that never connects cannot be suspended. The licence's end date is the hard limit, as the roadmap says.
- **The fingerprint** comes from the operating system's machine id. Where there is none, a random id is kept in the data folder, which is weaker: copying the folder copies the identity. The `/licence` page says which kind it is.
- **Cloning a virtual machine** copies its machine id. Two clones would both accept the licence.
- **Anyone with root on the server can replace the public key or the program.** This is licence enforcement for honest schools, not protection against a determined attacker. The roadmap's encrypted database and short-lived keys are not built.
- **No automatic updates.** An update is a new package unpacked over the old one. The roadmap's signed releases, maintenance windows and rollback are not started.
- **Not yet run on a real school machine.** Linux was tested in a container, without systemd. **Windows is untested**: the code has a Windows fingerprint path and the server is plain Node, but it has not been run there.
- **The database is not encrypted at rest**, and nothing is stored in it yet.
- Seats in use are not reported until phase 4, because there are no school accounts yet.
