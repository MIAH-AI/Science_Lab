# Learn with Nehy — Schools Roadmap

These documents plan how Learn with Nehy grows from today's public study dashboard into two products under one owner:

- A **public online app** with accounts, authentication, and authorization.
- A **campus appliance** installed on each campus server of a multi-campus boarding secondary school. Student devices reach it over the school's local network and need no internet access.

The Plysoft Tech Team runs both products from one platform admin console.

## Documents

| File | Read it for |
| --- | --- |
| [current-state.md](./current-state.md) | What the code does today and what is missing |
| [architecture.md](./architecture.md) | System diagrams, components, and data flow |
| [roles-and-permissions.md](./roles-and-permissions.md) | Every user type and what they can see and do |
| [domain-model.md](./domain-model.md) | Schools, campuses, users, tasks, learning events, and licenses |
| [licensing-and-deployment.md](./licensing-and-deployment.md) | Trials, seat caps, enrollment, releases, and remote suspension |
| [realtime-activity.md](./realtime-activity.md) | Streaming campus activity live to a central database |
| [security.md](./security.md) | Protecting the database, the code, and the content on client servers |
| [roadmap.md](./roadmap.md) | Phases, dependencies, and exit criteria |
| [decisions.md](./decisions.md) | Decisions made so far and questions still open |

## Ground rules

- Do not invent learner progress or completion figures. Show only what has been recorded.
- Student devices never need internet access. Only the campus server talks to the control service.
- The campus server is the source of truth for learner records. Activity streams to the cloud at the detail level each school agrees, pseudonymous by default.
- The public app and campus deployments keep separate accounts and databases.
