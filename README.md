# tough2simple

A study workspace for senior secondary Mathematics, Physics, Chemistry, Biology, Geography and Agricultural Science, live at https://learnwith-nehyy.netlify.app/ (moving to https://tough2simple.com/; formerly Learn with Nehy). Topics follow the WAEC syllabus today.

| Address                                                       | Page                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `/`                                                           | Public front page, in one of three designs                                                                   |
| `/demo`                                                       | Choose a role to try: Student, Teacher, School admin, Principal or Director                                  |
| `/app`                                                        | Study Desk: searches every topic across the six labs, opens each lab or its exam mode, and has a focus timer |
| `/app/classroom`, `/app/people`, `/app/campus`, `/app/school` | Demo screens for the school roles, on a made-up school with sample data (see `doc/roadmap/demo-mode.md`)     |
| `/waec-…`, `/physics_lab_full`, `/chemistry-simulations`      | The six labs                                                                                                 |

Every page opens in Day, like the front page, whatever the device is set to. Night is one tap away in the top bar and travels with the visitor as `?appearance=night`; nothing is stored.

**Front page design.** Set the environment variable `MARKETING_DESIGN` to `a`, `b` or `c` in the site's Netlify settings and redeploy. With no setting, visitors see design C. Add `?design=a` (or `b`, `c`) to the front page address to preview a design without changing the setting.

**Site address.** Link previews use the address in `SITE` in `src/routes/__root.tsx` and the `og:image` tags of the six lab pages. Change them to `https://tough2simple.com` once that domain is connected in Netlify.

Built with React 19, TypeScript, TanStack Start and Router, Vite, Tailwind CSS and Lucide icons. Fonts are self-hosted in `public/fonts`, so the app makes no third-party requests.

## Local development

Use Node 22.13+ or Node 24 and pnpm:

```sh
pnpm install
netlify dev --port 8889
```

Checks:

```sh
pnpm test        # unit and component tests (Vitest)
pnpm lint        # app code only; public/labs are excluded
pnpm typecheck
```

Two tools keep the labs and the Study Desk in step. Both need the labs served first (`python3 -m http.server 4802 --directory public`):

- `npx -y -p playwright@1 node tools/build-topic-index.mjs` rebuilds `src/data/topic-index.json`, the topic list behind the Study Desk and front page search. Run it after changing any lab's topics.
- `npx -y -p playwright@1 node tools/smoke-labs.mjs` opens every topic, mode and subtopic in all six labs and fails on any page error.

The Netlify build pipeline creates and validates the production build. UI preferences and the focus session are temporary and reset on refresh; the application does not store learner records.
