// Minimal static server that mimics vercel.json's rewrite rules, to sanity-check
// the merged dist/ output (main app + /poids sub-route) before deploying.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { statSync } from 'node:fs'
import { extname, join } from 'node:path'

const root = join(process.cwd(), 'dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.png': 'image/png', '.svg': 'image/svg+xml' }

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

// Mirrors vercel.json's rewrite order: static files win, then /poids(/*) -> poids/index.html, then catch-all.
function resolvePath(urlPath) {
  const filePath = join(root, decodeURIComponent(urlPath))
  if (isFile(filePath)) return filePath
  if (urlPath === '/poids' || urlPath.startsWith('/poids/')) return join(root, 'poids', 'index.html')
  return join(root, 'index.html')
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const filePath = resolvePath(url.pathname)
    const body = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' })
    res.end(body)
  } catch (e) {
    res.writeHead(404)
    res.end('not found: ' + e.message)
  }
}).listen(4173, () => console.log('preview server on http://localhost:4173'))
