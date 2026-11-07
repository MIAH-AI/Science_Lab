# Learn with Nehy — Schools Platform: Functional Requirements

| | |
| --- | --- |
| Owner | Plysoft Tech Team |
| Status | Draft for review |
| Date | November 2026 |
| Source | [presentation-print.html](./presentation-print.html) (architecture and roadmap deck) and the documents listed in [section 12](#12-related-documents) |

## 1. Purpose and scope

Learn with Nehy is a WAEC study workspace for Mathematics, Physics, and Chemistry. Today it is a public dashboard with three interactive labs and no accounts. This document defines what must be built to turn it into two products under one owner:

- **Public online app**: open study content for anyone, plus optional sign-in for learners who want their own activity history.
- **Campus appliance**: the same content plus school features (tasks, tracking, administration), installed on the server of each campus of a multi-campus boarding secondary school. Students use school computers that have no internet access and reach the appliance over the campus local network.

The Plysoft Tech Team licenses, deploys, updates, and monitors every campus from one platform admin console.

Requirement keywords: **Must** is required for the pilot; **Should** is expected unless there is a recorded reason not to; **Could** is optional.

## 2. Delivery tracks

Work runs in two parallel tracks. The content track is already under way.

| Track | Who | What | Login |
| --- | --- | --- | --- |
| **Content** | Content builder | Lessons, syllabus data, and simulations in `public/labs/` | None. All content must work without an account |
| **Platform** | Plysoft Tech Team | Accounts, tasks, tracking, school admin, licensing, campus agent, live activity | Added around the content, never required to view it |

The content track must meet [section 5](#5-content-and-labs-no-login) so the platform track can later add tasks and tracking without rewriting lessons.

## 3. Users and roles

| Role | Signs in at | Can do |
| --- | --- | --- |
| Anonymous visitor | Nowhere | Use every lesson and simulation on the public site |
| Public learner | Public cloud app | Everything a visitor can, plus see their own recorded activity |
| Platform admin (Plysoft Tech Team) | Cloud console only | Schools and campuses, 3 month trials, seat caps, scheduled releases, suspension, deployment health |
| School admin | That campus app | Invite teachers and students, approve or disable them, within the seat cap |
| Teacher | That campus app | Set tasks on syllabus topics, see submissions and lab activity for their classes |
| Student | That campus app | Complete assigned tasks and use the labs; activity recorded on the campus server |
| Principal | That campus app | See their campus: classes, task completion, usage |
| Director | Cloud portal and any campus app | See every campus in their school, live, from activity events and summaries |
| Campus IT operator | Campus server operating system | Start and stop services, disk space, encrypted backups; no database access |

Full scope rules and the permission matrix are in [roles-and-permissions.md](./roles-and-permissions.md).

## 4. Constraints and ground rules

- **C-1** Student devices never need internet access. Only the campus server talks to the cloud.
- **C-2** Each campus server needs one outbound HTTPS connection to the control service. Nothing connects into the school network.
- **C-3** Do not invent learner progress, completion, or usage figures. Show only what has been recorded.
- **C-4** The public app and campus deployments keep separate accounts and databases.
- **C-5** The campus server is the source of truth for learner records. Activity streams to the cloud at the detail level each school agrees, pseudonymous by default.
- **C-6** Keep the original lesson and simulation logic in the labs intact.
- **C-7** All interfaces use semantic HTML, keyboard access, visible focus, accessible names on icon buttons, and reduced-motion support.
- **C-8** The product is an independent study companion and is not affiliated with WAEC. The disclaimer stays visible.

## 5. Content and labs (no login)

These requirements apply to the content builder now. They keep content usable on the public site and the offline campus appliance, and let tasks and tracking attach later.

### 5.1 Access

| ID | Requirement | Priority |
| --- | --- | --- |
| CON-1 | Every lesson, syllabus page, and simulation works without signing in. No content feature may depend on an account | Must |
| CON-2 | Content must not store learner records or progress, including in `localStorage`, cookies, or files. Temporary UI state that resets on refresh is allowed | Must |
| CON-3 | Do not show progress, completion, or score statistics that were not recorded | Must |

### 5.2 Offline operation

| ID | Requirement | Priority |
| --- | --- | --- |
| CON-4 | Content works with no internet access: no requests to external hosts for fonts, scripts, styles, images, or analytics | Must |
| CON-5 | Self-host fonts. All three labs currently load Google Fonts (`fonts.googleapis.com`), which will fail on campus devices and fall back to system fonts | Must |
| CON-6 | The campus build excludes Netlify scripts (`/.netlify/scripts/ar`, `/.netlify/scripts/hud`) and external `og:image` links | Must |
| CON-7 | All asset paths are served from the app itself under `/labs/`, so the same files work on Netlify and on a campus server | Must |

### 5.3 Structure and identifiers

| ID | Requirement | Priority |
| --- | --- | --- |
| CON-8 | Keep syllabus content as structured data, separate from simulation engines, as today (`SYLLABUS` in the Mathematics and Physics labs, `SECTIONS` in the Chemistry lab) | Must |
| CON-9 | Every topic and subtopic has a stable identifier built from the subject and existing codes, for example `math.A.a` (Number bases) or `chem.2.0.d` (Electron configuration). Identifiers are never renumbered or reused; new content gets new identifiers | Must |
| CON-10 | Each subject publishes a content manifest (JSON) listing identifiers, titles, topic hierarchy, and the simulation engine for each subtopic. Tasks will reference these identifiers | Must |
| CON-11 | Every topic and subtopic is reachable by URL, for example `/waec-maths-dashboard?topic=math.A.a`, so a teacher can assign it and a student lands on it directly | Must |
| CON-12 | Counts shown on the dashboard (topics, subtopics, simulations) are derived from the manifests rather than typed by hand | Should |

### 5.4 Reporting hook

The labs will report activity once tracking exists. The content builder adds the calls now; they do nothing until the platform provides a listener.

| ID | Requirement | Priority |
| --- | --- | --- |
| CON-13 | Labs call one function for activity, for example `window.nehy?.report({ type, subject, topic, simulation, durationSeconds })`. When no listener exists the call does nothing | Must |
| CON-14 | Reported types: `lesson.opened`, `simulation.started`, `simulation.completed` | Must |
| CON-15 | Reports carry content identifiers only, never names or personal data | Must |
| CON-16 | Content behaves identically whether or not the hook is listening | Must |

### 5.5 Presentation and accessibility

| ID | Requirement | Priority |
| --- | --- | --- |
| CON-17 | Support `?appearance=night` and `?appearance=default` through the shared `glass.css` and `glass.js`; colors come from CSS variables | Must |
| CON-18 | Keyboard access to every topic and control, visible focus, accessible names, and reduced-motion overrides | Must |
| CON-19 | Text and controls meet WCAG 2.1 AA contrast in both themes | Should |
| CON-20 | Labs remain usable on typical school laptops and at small screen widths | Should |

### 5.6 Handoff between tracks

| Content track delivers | Platform track adds later |
| --- | --- |
| Lessons and simulations that work without login or internet | Sign-in for public learners and campus users |
| Stable identifiers and a manifest per subject | Tasks that reference identifiers |
| Deep links to every topic and subtopic | Task links that open the right topic |
| `window.nehy?.report(...)` calls | A listener that records events and feeds the outbox |
| Self-hosted assets under `/labs/` | Packaging into the signed campus image |

## 6. Platform functional requirements

### 6.1 Public accounts

| ID | Requirement | Priority |
| --- | --- | --- |
| PUB-1 | Learners can sign up, sign in, sign out, verify their email, and reset their password through a managed authentication provider | Must |
| PUB-2 | Signed-in learners see only their own recorded activity | Must |
| PUB-3 | All content remains available to anonymous visitors | Must |
| PUB-4 | Public accounts cannot sign in to any campus, and campus accounts cannot sign in to the public app | Must |

### 6.2 Learning record

| ID | Requirement | Priority |
| --- | --- | --- |
| LRN-1 | Record `lesson.opened`, `simulation.started`, and `simulation.completed` events for signed-in users, with subject, topic identifier, and duration | Must |
| LRN-2 | Learners see a history of their recorded activity. Nothing unrecorded is shown | Must |
| LRN-3 | Anonymous use records nothing | Must |

### 6.3 Tasks

| ID | Requirement | Priority |
| --- | --- | --- |
| TSK-1 | Teachers create tasks for their classes, linked to one or more topic or simulation identifiers, with instructions and a due date | Must |
| TSK-2 | Students see assigned tasks, open the linked topic directly, and mark work as submitted | Must |
| TSK-3 | Submission states: `not_started`, `in_progress`, `submitted`, `reviewed` | Must |
| TSK-4 | Teachers see, per task, which students have not started, are in progress, or have submitted, with related lab activity | Must |
| TSK-5 | Teachers can mark submissions reviewed | Should |
| TSK-6 | Grading is out of scope until the open question in [section 11](#11-open-questions) is resolved | — |

### 6.4 School administration

| ID | Requirement | Priority |
| --- | --- | --- |
| ADM-1 | The school admin invites teachers and students with printed invite codes or a class list import. No email is required | Must |
| ADM-2 | User states: `invited`, `pending`, `active`, `disabled`, `expired` (invite not used in time) | Must |
| ADM-3 | Invited users set a password on first sign-in, then wait for approval | Must |
| ADM-4 | The school admin approves, disables, and re-enables users on their own campus only | Must |
| ADM-5 | Approval is refused when it would exceed the license seat cap. Disabling a user frees a seat | Must |
| ADM-6 | Disabled users cannot sign in; their recorded work stays visible to teachers and principals | Must |
| ADM-7 | The school admin creates classes and assigns teachers and students to them | Must |
| ADM-8 | Every admin action is written to the audit log | Must |

### 6.5 Principal and director views

| ID | Requirement | Priority |
| --- | --- | --- |
| VIEW-1 | Principals see their campus: classes, task completion, and usage by subject | Must |
| VIEW-2 | Directors see every campus of their school on the cloud portal, live, at the agreed detail level | Must |
| VIEW-3 | Directors open named student records on the campus app, not in the cloud, unless the school agreed to full events | Must |
| VIEW-4 | Views show the time of the last update for each campus and never present stale figures as current | Must |

### 6.6 Real-time activity

| ID | Requirement | Priority |
| --- | --- | --- |
| RT-1 | Every recorded change writes an outbox event in the same database transaction | Must |
| RT-2 | The campus agent forwards outbox events to the central activity database within seconds | Must |
| RT-3 | While offline, events wait in the outbox and send on reconnect, with no duplicates (unique event ids) | Must |
| RT-4 | Event types: `user.signed_in`, `user.signed_out`, `user.invited`, `user.approved`, `user.disabled`, `user.enabled`, `task.created`, `task.updated`, `task.assigned`, `submission.started`, `submission.submitted`, `submission.reviewed`, `lesson.opened`, `simulation.started`, `simulation.completed` | Must |
| RT-5 | Detail level is set per school: counts only, pseudonymous events (default), or full events | Must |
| RT-6 | Pseudonymous codes are derived per campus with a secret held on the campus server | Must |
| RT-7 | Live dashboards show signed-in users, account changes, tasks, submissions, lesson and simulation use, and each campus's lag and unsent backlog | Must |
| RT-8 | The ingest API rejects events from unknown, suspended, or expired deployments | Must |

Details: [realtime-activity.md](./realtime-activity.md).

### 6.7 Licensing and trials

| ID | Requirement | Priority |
| --- | --- | --- |
| LIC-1 | One signed license per campus: status (`trial`, `active`, `suspended`, `expired`), start and end dates, seat cap, grace days, and the bound machine fingerprint | Must |
| LIC-2 | A test term is a `trial` license ending three months after it starts | Must |
| LIC-3 | After the end date the app is read-only for the grace period so teachers can export, then locks until extended | Must |
| LIC-4 | An edited license fails signature verification | Must |
| LIC-5 | Suspension in the console locks the campus on the agent's next check-in | Must |
| LIC-6 | Without a valid license for the grace period, the app locks | Must |
| LIC-7 | The console shows per campus: license status and days left, seats used and cap, version, pending releases, last check-in, health, lock state | Must |

### 6.8 Enrollment and updates (scheduled pull)

| ID | Requirement | Priority |
| --- | --- | --- |
| DEP-1 | The console issues a one-time, short-lived enrollment token per campus | Must |
| DEP-2 | Campus IT runs the installer once with the token. The agent fingerprints the machine, enrolls, receives the license, and starts the app | Must |
| DEP-3 | A release has a rollout: campuses (all, pilot first, or a named list), timing (date and time, weekly window, or next school holiday), track (pilot or stable), and urgency (normal or security fix) | Must |
| DEP-4 | Each campus has a maintenance window in campus time, blackout dates, and a postpone rule (default: the school admin may postpone once, for up to 7 days) | Must |
| DEP-5 | The agent downloads releases early and installs only inside the window and outside blackout dates | Must |
| DEP-6 | Security fixes skip the window but never install during class hours | Must |
| DEP-7 | Before switching versions the agent backs up the database; after switching it runs a health check and rolls back automatically if the new version is unhealthy | Must |
| DEP-8 | The agent reports `downloaded`, `installing`, `installed`, `failed`, or `rolled_back` for every release | Must |
| DEP-9 | Database migrations are reversible | Must |
| DEP-10 | Campuses with no outbound access receive a signed license file with a hard expiry and a signed offline bundle | Should |

Details: [licensing-and-deployment.md](./licensing-and-deployment.md).

## 7. Campus agent

The agent is the only process on the campus server that talks to the internet.

### 7.1 Responsibilities

| ID | Job | Technology | Priority |
| --- | --- | --- | --- |
| AGT-1 | Run all the time and start on boot | `systemd` service on Linux, or a Windows Service | Must |
| AGT-2 | Talk to the control service securely | HTTPS, trusting only the Plysoft CA, with a per-campus client certificate (mutual TLS) | Must |
| AGT-3 | Prove it is the licensed machine | Fingerprint from the server's TPM chip; machine id and hardware serials as fallback | Must |
| AGT-4 | Hold keys safely | TPM where present, otherwise the operating system key store; database key kept in memory, never written to disk | Must |
| AGT-5 | Verify licenses and releases | Ed25519 signatures with the Plysoft public key compiled into the agent; images pinned by digest; `cosign` or The Update Framework (TUF) | Must |
| AGT-6 | Check in every 30 seconds | Heartbeat with version, health, lock state, approved seats, and outbox backlog | Must |
| AGT-7 | Schedule installs | Time-zone-aware windows and blackout dates (DEP-4 to DEP-6) | Must |
| AGT-8 | Install, back up, roll back | Container runtime control (Docker, containerd, or Podman), backup script, health check (DEP-7) | Must |
| AGT-9 | Enforce the license | Lock on suspension or after the grace period; unlock when a valid license returns (LIC-5, LIC-6) | Must |
| AGT-10 | Forward activity events | Read the outbox every few seconds, send in batches, mark sent after acknowledgement (RT-2, RT-3) | Must |
| AGT-11 | Remember its own state | Local SQLite or JSON state: version, previous version, staged release, last valid license, lock state | Must |
| AGT-12 | Log restarts, backups, and restores | Audit log entries reported on the heartbeat | Must |
| AGT-13 | Update itself | A/B layout: keep the previous binary and switch back if the new one fails to start | Should |

### 7.2 Build options

| Option | Summary | Use |
| --- | --- | --- |
| **Option 1 (recommended): Go** | One self-contained program for Linux and Windows; mature TLS, TPM (`go-tpm`), TUF (`go-tuf`), and container libraries; compiled code is harder for campus IT to read or modify. Cost: a second language alongside TypeScript | Production agent |
| **Option 2: TypeScript on Node.js** | Same language as the app and control service, code can be shared; packaged as one program with Node single executable applications or Bun. Costs: larger file with a bundled runtime, source easier to extract, weaker TPM libraries | Acceptable for the one-term pilot if speed matters most; rewrite in Go before adding campuses |

Licensing, key release, and the outbox are specific to this product and are built whichever option is chosen.

### 7.3 Suggested layout (option 1)

```text
nehy-agent/
  cmd/nehy-agent/    service entry point
  internal/
    transport/       mutual TLS client
    identity/        TPM fingerprint
    license/         verify, grace, lock
    update/          stage, window, switch, health, rollback
    outbox/          forward activity events
    state/           agent state
  deploy/            systemd unit, installer
```

## 8. Security requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| SEC-1 | The campus database and every backup are encrypted. The key is released only to a valid license on the bound fingerprint and is never stored in config, environment files, or backups | Must |
| SEC-2 | Campus IT has an operator role only: no database password and no query console | Must |
| SEC-3 | The campus app ships as a signed image without source maps or development tooling | Must |
| SEC-4 | Lesson and simulation bundles in the campus image are encrypted at rest and opened with a short-lived content key | Should |
| SEC-5 | Each campus build and database is watermarked with the campus id | Should |
| SEC-6 | Campus passwords use Argon2 or bcrypt, sessions are bound to the campus, and repeated failed sign-ins lock the account temporarily | Must |
| SEC-7 | Every Plysoft Tech Team console account uses a second factor | Must |
| SEC-8 | The campus app serves HTTPS on the local network with a certificate issued at enrollment | Should |
| SEC-9 | Every authorization check runs on the server. Hiding a control in the UI is not authorization | Must |
| SEC-10 | Plysoft staff access to the central activity database is limited to named roles and logged | Must |
| SEC-11 | Contracts prohibit image export, key extraction, and reverse engineering, and allow audit | Must |

A determined server administrator who dumps the running process can still read keys; the contract and audit trail cover that risk. Details: [security.md](./security.md).

## 9. Non-functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-1 | Campus features work with no internet; only licensing, updates, and live activity need the outbound connection | Must |
| NFR-2 | A short internet outage does not interrupt lessons (grace period) | Must |
| NFR-3 | Live activity reaches the central dashboard within seconds while connected | Must |
| NFR-4 | Updates never install during class hours or blackout dates | Must |
| NFR-5 | Supported browsers: current Chrome, Edge, and Firefox on school laptops | Must |
| NFR-6 | Accessibility target: WCAG 2.1 AA | Should |
| NFR-7 | Times are stored in UTC and shown in campus time | Must |
| NFR-8 | Interface language: English | Must |
| NFR-9 | Students and staff per campus, and server specifications, are confirmed with the school before load targets are set | Must |

## 10. Acceptance criteria by phase

| Phase | Done when |
| --- | --- |
| 1. Product rules | Role list, license terms, outbound network requirement, and live activity detail level signed off with the first school |
| 2. Public accounts | A public learner signs in and reaches only their own data; anonymous visitors still use all content |
| 3. Learning record | A learner sees their own recorded activity, and nothing unrecorded |
| 4. Tasks | A teacher assigns a task, a student completes it, the teacher sees the result |
| 5. School admin | A class is onboarded with invite codes, and approval past the seat cap is refused |
| 6. Campus image | The image runs on a test server with student devices offline and no external requests |
| 7. Control service and agent | A test campus enrolls, installs an update inside its window, rolls back a bad release, and locks on suspension |
| 8. Key release | A copied install and a copied database both fail on another machine |
| 9. Director view and live activity | Activity appears centrally within seconds; an offline campus catches up without duplicates; identities leave only at the agreed level |
| 10. One-term pilot | One campus runs a full term on a trial license; the trial ends as designed; the school decides next steps |

The content track is accepted when CON-1 to CON-18 pass on the public site and on a test server with the network disconnected.

## 11. Open questions

- Campus database and its encryption method.
- Operating systems on campus servers.
- TypeScript (option 2) for the pilot agent, or Go from the start.
- Default maintenance window, and who may postpone updates.
- Grace period before a disconnected or suspended campus locks.
- Invites: printed codes, class list import, or both.
- Which summaries directors need, and how often.
- Live activity detail level per school.
- WebSocket or batched HTTPS for event streaming.
- Retention for the central activity database and the campus outbox.
- Which Plysoft staff roles may view activity data.
- Public authentication provider.
- Grading submissions, or completion only.
- What happens to campus data when a school leaves.

The decision log is in [decisions.md](./decisions.md).

## 12. Related documents

| File | Read it for |
| --- | --- |
| [presentation-print.html](./presentation-print.html) | The architecture and roadmap deck on one page. Open in a browser and print or save as PDF |
| [current-state.md](./current-state.md) | What the code does today and what is missing |
| [architecture.md](./architecture.md) | System diagrams, components, and data flow |
| [roles-and-permissions.md](./roles-and-permissions.md) | Roles, scope rules, user lifecycle, permission matrix |
| [domain-model.md](./domain-model.md) | Schools, campuses, users, tasks, learning events, licenses |
| [licensing-and-deployment.md](./licensing-and-deployment.md) | Trials, seat caps, enrollment, scheduled updates, suspension |
| [realtime-activity.md](./realtime-activity.md) | Streaming campus activity live to a central database |
| [security.md](./security.md) | Protecting the database, code, and content on client servers |
| [roadmap.md](./roadmap.md) | Phases, dependencies, and exit criteria |
| [decisions.md](./decisions.md) | Decisions made so far and questions still open |
