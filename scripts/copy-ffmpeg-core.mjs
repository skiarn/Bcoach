import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

const sourceDir = resolve(rootDir, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm')
const targetDir = resolve(rootDir, 'public', 'ffmpeg')

const filesToCopy = ['ffmpeg-core.js', 'ffmpeg-core.wasm']

if (!existsSync(sourceDir)) {
  throw new Error(`FFmpeg core source directory not found: ${sourceDir}`)
}

mkdirSync(targetDir, { recursive: true })

for (const fileName of filesToCopy) {
  const sourcePath = resolve(sourceDir, fileName)
  const targetPath = resolve(targetDir, fileName)

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing FFmpeg core file: ${sourcePath}`)
  }

  cpSync(sourcePath, targetPath)
  console.log(`[prebuild] Copied ${fileName} -> public/ffmpeg/${fileName}`)
}
