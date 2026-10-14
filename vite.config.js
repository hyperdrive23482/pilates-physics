import { renameSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vercel serves a static file before it looks at rewrites, so a built
// dist/index.html would answer "/" and the home page would never reach the
// head injection in api/render-page.js. The build emits the shell as
// app-shell.html instead; vercel.json sends every route to it or to the
// render function. The dev server is unaffected.
function renameShell() {
  let outDir
  return {
    name: 'pp-rename-shell',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      renameSync(path.join(outDir, 'index.html'), path.join(outDir, 'app-shell.html'))
    },
  }
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    renameShell(),
  ],
})
