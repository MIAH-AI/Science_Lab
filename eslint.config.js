import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    // public/labs are standalone pages kept close to their originals; recovered-from-live is an archive.
    ignores: [
      'dist/**',
      '.netlify/**',
      '.tanstack/**',
      'src/routeTree.gen.ts',
      'public/**',
      'recovered-from-live/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
)
