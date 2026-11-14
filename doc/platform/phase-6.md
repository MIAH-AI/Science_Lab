# Phase 6: console sidebar, overview, content, usage and people

Branch `platform/6-console-insights`, on top of phase 5.

## What changed

- **Sidebar.** The console's sections moved from the top bar to a sidebar: Overview, Schools, People, Content, Usage, Admins, Audit trail. On a phone it becomes a strip that scrolls sideways.
- **Overview** (`/console`) is the first screen: schools, campuses licensed now, seats in use, what was opened in 14 days, campuses that need attention (no licence, ending within 30 days, read-only, ended, suspended, not checked in for 7 days, every seat in use) and the six latest changes. The Schools list moved to `/console/schools`.
- **Content** (`/console/content`) lists the six subjects with their topics and subtopics from the topic index, links to each lab and its exam practice, and how often each was opened in 30 days. Content ships with a release, so this screen reads it and does not edit it.
- **Usage** (`/console/usage`) shows labs opened, exam practice opened and Study Desk visits for 7, 30 or 90 days, by day, by subject and by place (the website, or a campus).
- **People** (`/console/people`) shows, for each campus, seats in use and how many students, teachers, leaders, waiting, invited and disabled accounts its server has.
- **Sign-in.** Typing or pasting the sixth digit of the authenticator code signs in without pressing the button. A wrong code is cleared.
- **Lab addresses on a developer's machine.** `vite dev` and `vite preview` now map the six short lab addresses the way `netlify.toml` does. Before this they answered "page not found" locally.

## How usage is counted

`src/server/usage.ts` holds the whole of it.

- The Study Desk and `public/labs/glass.js` send one small request to `/api/usage` when they open: a subject and one of `desk`, `lab`, `exam`. No cookie is read or set.
- The server adds one to a row in `usage_daily (day, source, subject, kind, count)`. Nothing about the person is stored: no account, no device, no address. These are counts, not learner records, so CON-2 still holds.
- On the website the source is `web`, and counting happens only where the console is switched on (it needs the console's database). Elsewhere the address answers and keeps nothing.
- A school server counts in its own database under `local`. Each check-in carries its daily totals for the last 35 days; the control service keeps them under the campus id and takes the larger number for a day, so a repeated or replayed check-in changes nothing. A server that never goes online is not in the figures.
- One address can add at most 40 counts a minute (held in memory for that minute only). Subjects and kinds are checked against a fixed list, and report rows with a day in the future, older than 35 days, or an impossible count are dropped.

A count is one opening of a page. It is not a number of people: a student who opens Physics three times is three.

## People

A school server's check-in also carries six numbers (`students`, `teachers`, `leaders`, `pending`, `invited`, `disabled`). Names, usernames, classes and passwords never leave the school. A school's own admin manages its accounts on the school server; the console cannot add or remove a school's people.

## Database

Control service migration 2 adds `usage_daily` and `campuses.people`. School server migration 3 adds `usage_daily`. Both apply themselves on the next start. A school server on an older version keeps working; it sends no people or usage figures until it is updated.

## Tests

- Unit: `src/server/usage.test.ts` (counting, report rows refused, repeat check-ins, the report).
- Browser journeys (kept outside the repository): console 66 checks, school server 44, school accounts 48, including a school server's openings arriving in the console.

## Still open

- **Counts can be inflated** by someone sending requests by hand, within the per-address limit. They are a guide to what is used, not a bill.
- **No topic-level figures.** A count says a subject's lab was opened, not which topic inside it.
- **No numbers of people for the website.** There are no accounts online, so the website has openings only.
- **The console cannot manage a school's accounts**, by design. If that is wanted, it needs a decision about what a school's data the platform may hold.
