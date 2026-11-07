# Decisions and open questions

## Decisions

| Decision | Reason |
| --- | --- |
| Two products: public cloud and campus appliance | Students have devices but no internet. The public still needs an online version |
| Student devices use only the campus network | Matches the school's setup |
| Each campus server makes outbound HTTPS calls to the control service | Required for remote licensing, releases, and suspension |
| The agent pulls from the control service. Nothing pushes into the campus | Works through school firewalls and keeps the campus network closed |
| Updates use scheduled pull: download early, install only inside each campus's maintenance window | Any interval with no one on site, no updates during lessons or exams |
| Build the campus agent in Go (option 1); TypeScript on Node.js is option 2 | Go gives one self-contained, harder-to-tamper program; TypeScript is a faster start for the current team |
| The campus app runs as containers under the agent; a signed USB bundle is the offline fallback | Reuses proven install and rollback tooling, and still covers campuses without outbound access |
| One license per campus, bound to its server | Stops a copied install from running elsewhere |
| Trial licenses for a 3 month test term | The school asked to test for one term |
| The campus database is the source of truth for learner records | Campuses keep working when offline |
| Activity streams live to a central activity database through an outbox on each campus | Directors and the Plysoft Tech Team need live visibility across campuses, without losing events during outages |
| Central events use campus-specific pseudonymous codes by default | Live visibility without moving student identities to the cloud |
| Public and school accounts are separate | Keeps school data out of the public product |
| The Plysoft Tech Team manages licenses but does not read learner records | Limits who can see student data |
| Build school features in the cloud before packaging the appliance | Easier to iterate before servers are involved |

## Open questions

- Which database for the campus appliance, and which encryption method for it?
- Is TypeScript (option 2) used for the pilot agent, or Go from the start?
- What is the default maintenance window, and who may postpone an update?
- Which operating systems do the campus servers run?
- How long is the grace period before a disconnected or suspended campus locks?
- How do invites reach students without email: printed codes, class list import, or both?
- Which summaries do directors need, and how often should campuses upload them?
- Which detail level does each school agree to for live activity: counts only, pseudonymous events, or full events?
- Persistent WebSocket or batched HTTPS for streaming events from the agent?
- How long are events kept in the central activity database and in the campus outbox?
- Which Plysoft staff roles may view central activity data?
- Which authentication provider for the public app?
- How long are learner records kept, and who can request deletion?
- Do teachers need to grade submissions, or only see completion?
- What happens to campus data when a school stops using the product?
