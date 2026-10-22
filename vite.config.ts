import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * The page font's request starts from the HTML (docs/quality.md): a preload for Outfit's latin file, the one every
 * page's words use, with the hashed name the build gave it. The latin-ext file stays on demand.
 */
function preloadFont(): Plugin {
  return {
    name: 'vic:preload-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((f) => /outfit-latin-wght-normal-[\w-]+\.woff2$/.test(f))
        if (!font) throw new Error('vic:preload-font: the Outfit latin file is missing from the build')
        return [{ tag: 'link', attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' }]
      },
    },
  }
}

/** `/apply` is apply.html, as vercel.json rewrites it, in `npm run dev` and `npm run preview` too. */
function applyRoute(): Plugin {
  const rewrite = (req: { url?: string }, _: unknown, next: () => void) => {
    if (req.url === '/apply' || req.url?.startsWith('/apply?')) req.url = req.url.replace('/apply', '/apply.html')
    next()
  }
  return {
    name: 'vic:apply-route',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFont(), applyRoute()],
  build: {
    rollupOptions: {
      // 404.html: what Vercel serves, with a 404 status, for any path that isn't a file
      // apply.html: the registration form at /apply, its own entry so the landing's 3D bundle never loads there
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
        apply: resolve(import.meta.dirname, 'apply.html'),
      },
    },
  },
})
