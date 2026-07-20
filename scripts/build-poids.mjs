// Builds the poids-pwa sub-app with base path "/poids/" and copies its
// output into dist/poids/, so the main Vercel deployment serves it as a
// sub-route alongside the primary Péyi app. Run after the main `vite build`.
import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const subApp = join(root, 'poids-pwa')
const subDist = join(subApp, 'dist')
const targetDir = join(root, 'dist', 'poids')

console.log('[build-poids] installing poids-pwa dependencies…')
execSync('npm install', { cwd: subApp, stdio: 'inherit' })

console.log('[build-poids] building poids-pwa with base path /poids/…')
execSync('npm run build', {
  cwd: subApp,
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE_PATH: '/poids/' },
})

if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true })
cpSync(subDist, targetDir, { recursive: true })
console.log(`[build-poids] copied ${subDist} -> ${targetDir}`)
