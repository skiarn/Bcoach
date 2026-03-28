import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')

const FILE_ALLOWLIST = [
  path.join('src', 'i18n', 'messages.ts'),
  path.join('src', 'generated', 'catalog.ts'),
]

const TEXT_ALLOWLIST = [
  /^Bcoach$/i,
  /^🏐\s*Bcoach$/i,
  /^SV$/,
  /^EN$/,
  /^REC$/,
  /^\d+s$/,
  /^\d+(\.\d+)?x$/,
  /^\u25B6$/, // ▶
  /^\u23F8$/, // ⏸
  /^\u23F9$/, // ⏹
]

const TEXT_ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt'])

function shouldIgnoreText(raw) {
  const text = raw.trim()
  if (!text) return true
  if (!/[A-Za-z\u00C0-\u017F]/.test(text)) return true
  return TEXT_ALLOWLIST.some((pattern) => pattern.test(text))
}

function walk(dirPath, out) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, out)
      continue
    }

    if (entry.isFile() && fullPath.endsWith('.tsx')) {
      out.push(fullPath)
    }
  }
}

function toRepoPath(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/')
}

const files = []
walk(SRC_DIR, files)

const findings = []

for (const absPath of files) {
  const repoPath = toRepoPath(absPath)
  if (FILE_ALLOWLIST.includes(repoPath)) {
    continue
  }

  const content = fs.readFileSync(absPath, 'utf8')
  const sourceFile = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  const pushFinding = (position, text, kind) => {
    if (shouldIgnoreText(text)) return

    // Ignore translation key literals, for example <Trans k="history.title" />.
    if (/^[a-z]+\.[a-z0-9_.-]+$/.test(text.trim())) return

    const line = sourceFile.getLineAndCharacterOfPosition(position).line + 1
    findings.push({ file: repoPath, line, text: text.trim(), kind })
  }

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      pushFinding(node.getStart(sourceFile), node.getText(sourceFile), 'jsx-text')
    }

    if (ts.isJsxAttribute(node) && node.initializer) {
      const attrName = node.name.getText(sourceFile)
      if (TEXT_ATTRS.has(attrName)) {
        if (ts.isStringLiteral(node.initializer)) {
          pushFinding(node.initializer.getStart(sourceFile), node.initializer.text, 'jsx-attr')
        }

        if (ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isStringLiteralLike(node.initializer.expression)) {
          pushFinding(node.initializer.expression.getStart(sourceFile), node.initializer.expression.text, 'jsx-attr-expression')
        }
      }
    }

    if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteralLike(node.expression)) {
      pushFinding(node.expression.getStart(sourceFile), node.expression.text, 'jsx-expression-string')
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

if (findings.length === 0) {
  console.log('i18n-literals: ok (no hardcoded TSX UI strings found)')
  process.exit(0)
}

console.error('i18n-literals: found hardcoded UI literals:')
for (const finding of findings) {
  console.error(`- ${finding.file}:${finding.line} [${finding.kind}] ${finding.text}`)
}

console.error('\nMove these literals into src/i18n/messages.ts and render via useI18n().')
process.exit(1)
