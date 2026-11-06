# Learn with Nehy

A glass-inspired WAEC study workspace for Mathematics, Physics, and Chemistry. Pearl-lavender day mode and deep-indigo night mode pair sculpted sidebars with glossy subject cards, search, a 25-minute focus timer, and guidance. Subject cards open the existing learning labs at https://learnwithnehy.netlify.app/.

Built with React 19, TypeScript, TanStack Start and Router, Vite, Tailwind CSS, Radix UI, and Lucide icons. Decorative artwork uses CSS and SVG, keeping it sharp at every screen size.

## Local development

Use Node 22.13+ or Node 24 and pnpm:

```sh
pnpm install
netlify dev --port 8889
```

The Netlify build pipeline creates and validates the production build. UI preferences and the focus session are temporary and reset on refresh; the application does not store learner records.
