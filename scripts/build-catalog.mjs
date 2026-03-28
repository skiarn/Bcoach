import fs from 'fs'
import path from 'path'

const REPO_ROOT = process.cwd()
const CATALOG_DIR = path.join(REPO_ROOT, 'data/catalog')
const OUTPUT_FILE = path.join(REPO_ROOT, 'src/generated/catalog.ts')
const DEFAULT_LOCALE = 'sv'

function parseCsv(csvText) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index]
    const nextChar = csvText[index + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"'
        index += 1
        continue
      }

      if (char === '"') {
        inQuotes = false
        continue
      }

      cell += char
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    if (char === '\r') {
      continue
    }

    cell += char
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((entry) => !(entry.length === 1 && entry[0] === ''))
}

function readCsv(fileName) {
  const filePath = path.join(CATALOG_DIR, fileName)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing catalog file: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const rows = parseCsv(content)
  if (rows.length < 1) {
    throw new Error(`CSV file is empty: ${fileName}`)
  }

  const headers = rows[0]
  return rows.slice(1).map((values, rowIndex) => {
    const rowObject = {}
    headers.forEach((header, columnIndex) => {
      rowObject[header] = values[columnIndex] ?? ''
    })
    rowObject.__row = rowIndex + 2
    return rowObject
  })
}

function parseBoolean(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function parseSortOrder(value, fallback = 9999) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function splitList(value) {
  return String(value ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function getLocaleFiles(prefix) {
  const allFiles = fs.readdirSync(CATALOG_DIR)
  const regex = new RegExp(`^${prefix}\\.([a-z]{2,})\\.csv$`)

  return allFiles
    .map((fileName) => {
      const match = fileName.match(regex)
      if (!match) {
        return null
      }

      return {
        fileName,
        locale: match[1].toLowerCase(),
      }
    })
    .filter(Boolean)
}

function buildCatalog() {
  const sportsRows = readCsv('sports.csv')
  const skillsRows = readCsv('skills.csv')

  const sportLocaleFiles = getLocaleFiles('sports')
  const skillLocaleFiles = getLocaleFiles('skill_texts')

  assert(sportLocaleFiles.length > 0, 'Missing language files: expected at least one sports.<lang>.csv file')
  assert(skillLocaleFiles.length > 0, 'Missing language files: expected at least one skill_texts.<lang>.csv file')

  const sportLocales = new Set(sportLocaleFiles.map((entry) => entry.locale))
  const skillLocales = new Set(skillLocaleFiles.map((entry) => entry.locale))

  assert(sportLocales.has(DEFAULT_LOCALE), `Missing default language file: sports.${DEFAULT_LOCALE}.csv`)
  assert(skillLocales.has(DEFAULT_LOCALE), `Missing default language file: skill_texts.${DEFAULT_LOCALE}.csv`)

  const localeSet = new Set([DEFAULT_LOCALE])
  const sports = []
  const sportIdSet = new Set()

  sportsRows.forEach((row) => {
    const id = row.sport_id?.trim()
    assert(id, `sports.csv row ${row.__row}: sport_id is required`)
    assert(!sportIdSet.has(id), `sports.csv row ${row.__row}: duplicate sport_id "${id}"`)

    sportIdSet.add(id)
    sports.push({
      id,
      enabled: parseBoolean(row.enabled),
      sortOrder: parseSortOrder(row.sort_order),
      aliases: splitList(row.aliases),
      labels: {},
    })
  })

  const sportsById = new Map(sports.map((sport) => [sport.id, sport]))

  sportLocaleFiles.forEach(({ fileName, locale }) => {
    const rows = readCsv(fileName)
    localeSet.add(locale)

    const seenSportIds = new Set()
    rows.forEach((row) => {
      const sportId = row.sport_id?.trim()
      const label = row.label?.trim()

      assert(sportId, `${fileName} row ${row.__row}: sport_id is required`)
      assert(label, `${fileName} row ${row.__row}: label is required`)
      assert(sportsById.has(sportId), `${fileName} row ${row.__row}: unknown sport_id "${sportId}"`)
      assert(!seenSportIds.has(sportId), `${fileName} row ${row.__row}: duplicate sport_id "${sportId}"`)

      seenSportIds.add(sportId)
      sportsById.get(sportId).labels[locale] = label
    })

    sports.forEach((sport) => {
      assert(sport.labels[locale], `${fileName}: missing label row for sport_id "${sport.id}"`)
    })
  })

  const skills = []
  const skillIdSet = new Set()
  const skillById = new Map()

  skillsRows.forEach((row) => {
    const id = row.skill_id?.trim()
    const sportId = row.sport_id?.trim()

    assert(id, `skills.csv row ${row.__row}: skill_id is required`)
    assert(sportId, `skills.csv row ${row.__row}: sport_id is required`)
    assert(sportIdSet.has(sportId), `skills.csv row ${row.__row}: unknown sport_id "${sportId}"`)
    assert(!skillIdSet.has(id), `skills.csv row ${row.__row}: duplicate skill_id "${id}"`)

    const skill = {
      id,
      sportId,
      enabled: parseBoolean(row.enabled),
      sortOrder: parseSortOrder(row.sort_order),
      videoUrls: splitList(row.video_urls),
      texts: {},
    }

    skillIdSet.add(id)
    skillById.set(id, skill)
    skills.push(skill)
  })

  skillLocaleFiles.forEach(({ fileName, locale }) => {
    const rows = readCsv(fileName)
    localeSet.add(locale)

    const seenSkillIds = new Set()
    rows.forEach((row) => {
      const skillId = row.skill_id?.trim()
      const name = row.name?.trim()

      assert(skillId, `${fileName} row ${row.__row}: skill_id is required`)
      assert(name, `${fileName} row ${row.__row}: name is required`)
      assert(skillById.has(skillId), `${fileName} row ${row.__row}: unknown skill_id "${skillId}"`)
      assert(!seenSkillIds.has(skillId), `${fileName} row ${row.__row}: duplicate skill_id "${skillId}"`)

      seenSkillIds.add(skillId)
      skillById.get(skillId).texts[locale] = {
        name,
        advice: splitList(row.advice),
        nextSteps: splitList(row.next_steps),
      }
    })

    skills.forEach((skill) => {
      assert(skill.texts[locale], `${fileName}: missing text row for skill_id "${skill.id}"`)
    })
  })

  skills.forEach((skill) => {
    assert(
      skill.texts[DEFAULT_LOCALE],
      `skills validation: missing ${DEFAULT_LOCALE} text row for skill_id "${skill.id}"`
    )
  })

  sports.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  skills.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))

  const supportedLocales = Array.from(localeSet).sort((a, b) => {
    if (a === DEFAULT_LOCALE) return -1
    if (b === DEFAULT_LOCALE) return 1
    return a.localeCompare(b)
  })

  const banner = [
    '/* eslint-disable */',
    '// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.',
    '// Generated by scripts/build-catalog.mjs from data/catalog/*.csv',
    '',
  ].join('\n')

  const output = `${banner}export const DEFAULT_LOCALE = ${JSON.stringify(DEFAULT_LOCALE)} as const\n\n`
    + `export const SUPPORTED_LOCALES = ${JSON.stringify(supportedLocales, null, 2)} as const\n\n`
    + 'export interface GeneratedSportDefinition {\n'
    + '  id: string\n'
    + '  enabled: boolean\n'
    + '  sortOrder: number\n'
    + '  aliases: string[]\n'
    + '  labels: Record<string, string>\n'
    + '}\n\n'
    + 'export interface GeneratedSkillText {\n'
    + '  name: string\n'
    + '  advice: string[]\n'
    + '  nextSteps: string[]\n'
    + '}\n\n'
    + 'export interface GeneratedSkillDefinition {\n'
    + '  id: string\n'
    + '  sportId: string\n'
    + '  enabled: boolean\n'
    + '  sortOrder: number\n'
    + '  videoUrls: string[]\n'
    + '  texts: Record<string, GeneratedSkillText>\n'
    + '}\n\n'
    + `export const generatedSports: GeneratedSportDefinition[] = ${JSON.stringify(sports, null, 2)}\n\n`
    + `export const generatedSkills: GeneratedSkillDefinition[] = ${JSON.stringify(skills, null, 2)}\n`

  ensureDirectory(OUTPUT_FILE)
  fs.writeFileSync(OUTPUT_FILE, output)

  console.log(`Catalog generated: sports=${sports.length}, skills=${skills.length}, locales=${supportedLocales.join(',')}`)
}

try {
  buildCatalog()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[build-catalog] ${message}`)
  process.exit(1)
}
