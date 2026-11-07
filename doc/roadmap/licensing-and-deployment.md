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

## Releases

1. The Plysoft Tech Team publishes a signed release and chooses which campuses receive it.
2. The control service queues a release job per campus.
3. On the next heartbeat the agent downloads the image, verifies the signature and digest, and backs up the database.
4. The agent swaps versions and reports `installed`, or rolls back and reports `failed`.

Database migrations run during the swap and must be reversible.

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
