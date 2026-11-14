import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

// The six labs live at short addresses. Netlify maps them with the rewrites in netlify.toml; this does
// the same for `vite dev` and `vite preview`, so the labs also open on a developer's machine.
const LABS = [
  'waec-maths-dashboard',
  'physics_lab_full',
  'chemistry-simulations',
  'waec-biology-lab',
  'waec-geography-lab',
  'waec-agric-lab',
]
type Next = () => void
const labRewrite = (req: { url?: string }, _res: unknown, next: Next) => {
  const [path, query] = (req.url ?? '').split('?')
  const slug = path.replace(/^\/|\/$/g, '')
  if (LABS.includes(slug))
    req.url = `/labs/${slug}.html${query ? `?${query}` : ''}`
  next()
}
const labAddresses = (): Plugin => ({
  name: 'lab-addresses',
  configureServer: (server) => void server.middlewares.use(labRewrite),
  configurePreviewServer: (server) => void server.middlewares.use(labRewrite),
})

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    labAddresses(),
    tailwindcss(),
    netlify(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
