# Learn with Nehy

A WAEC study workspace for Mathematics, Physics, Chemistry, Biology, Geography and Agricultural Science, live at https://learnwith-nehyy.netlify.app/. The home page ("Study Desk") searches every topic across the six labs, opens each lab or its exam mode in one tap, and has a focus timer. Day and Night themes follow the device setting.

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

Two tools keep the labs and the home page in step. Both need the labs served first (`python3 -m http.server 4802 --directory public`):

- `npx -y -p playwright@1 node tools/build-topic-index.mjs` rebuilds `src/data/topic-index.json`, the topic list behind the home page search. Run it after changing any lab's topics.
- `npx -y -p playwright@1 node tools/smoke-labs.mjs` opens every topic, mode and subtopic in all six labs and fails on any page error.

The Netlify build pipeline creates and validates the production build. UI preferences and the focus session are temporary and reset on refresh; the application does not store learner records.
