// Imports Statistics Canada "Monthly average retail prices for selected
// products" (table 18-10-0245-01) into the TypicalPrice table, so a shopping
// list can be estimated with official provincial averages.
//
// 1. Download the table as CSV: https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501
//    -> Download options -> Download entire table (CSV). Unzip it and put the
//    big CSV (not the "MetaData" one) at data/statcan-18100245.csv.
// 2. Preview, nothing is written:
//      node scripts/import-typical-prices-statcan.mjs data/statcan-18100245.csv --dry-run
// 3. Import for real:
//      node --env-file=.env.local scripts/import-typical-prices-statcan.mjs data/statcan-18100245.csv
//
// Re-running is safe: it replaces this source's rows for each period it imports.
// Data: Statistics Canada, Open Government Licence - Canada.

import fs from 'node:fs'

const SOURCE = 'Statistics Canada'
const SOURCE_URL = 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501'
const MAX_AGE_MONTHS = 6 // ignore a province's figure if it is older than this vs the newest month in the file

// --- tiny CSV parser (quoted fields, BOM) ---
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row) }
  return rows
}

// "Milk, 2 litres" -> { name: 'milk', unit: '2 L' }; "Ground beef, per kilogram" -> { name: 'ground beef', unit: '1 kg' }
const SIZE = /^(.*?),\s*(per\s+(?:kilogram|litre|dozen|100\s+grams)|\d+(?:\.\d+)?\s*(?:kilograms?|grams?|litres?|millilitres?|dozen|units?))\s*$/i
function parseProduct(raw) {
  const m = SIZE.exec(raw.trim())
  const nameRaw = m ? m[1] : raw.trim()
  const sizeRaw = m ? m[2].toLowerCase() : null
  let unit = null
  if (sizeRaw) {
    if (sizeRaw.startsWith('per')) {
      if (sizeRaw.includes('kilogram')) unit = '1 kg'
      else if (sizeRaw.includes('litre')) unit = '1 L'
      else if (sizeRaw.includes('dozen')) unit = '1 dozen'
      else if (sizeRaw.includes('100')) unit = '100 g'
    } else {
      const n = parseFloat(sizeRaw)
      if (/kilogram/.test(sizeRaw)) unit = `${n} kg`
      else if (/millilitre/.test(sizeRaw)) unit = `${n} ml`
      else if (/litre/.test(sizeRaw)) unit = `${n} L`
      else if (/gram/.test(sizeRaw)) unit = `${n} g`
      else if (/dozen/.test(sizeRaw)) unit = `${n} dozen`
      else unit = `${n} each`
    }
  }
  return { label: nameRaw.trim(), unit }
}

// Names shoppers actually type, mapped from the source's wording. Extend as
// the dry run shows unmapped products.
const ALIASES = {
  'pork rib': ['pork ribs', 'ribs'],
  'pork loin': ['pork loin'],
  'pork shoulder': ['pork shoulder'],
  'beef stewing': ['stewing beef', 'beef stew meat'],
  'whole chicken': ['chicken', 'whole chicken'],
  'chicken, whole': ['chicken', 'whole chicken'],
  'chicken breasts': ['chicken breast', 'chicken breasts'],
  'chicken thigh': ['chicken thighs'],
  'chicken drumsticks': ['chicken drumsticks'],
  'bread, white': ['bread', 'white bread'],
}
// Pack size to use when a list line has no unit of its own.
const DEFAULT_PACK = { milk: '2 L' }

function cleanKey(label) {
  return label.toLowerCase().replace(/\bfresh or frozen\b/g, '').replace(/\bcuts?\b/g, '').replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '')
}

const [file, ...flags] = process.argv.slice(2)
const dry = flags.includes('--dry-run')
if (!file) { console.error('Usage: node scripts/import-typical-prices-statcan.mjs <csv> [--dry-run]'); process.exit(1) }

const rows = parseCsv(fs.readFileSync(file, 'utf8'))
const head = rows[0]
const col = (n) => head.indexOf(n)
const iDate = col('REF_DATE'), iGeo = col('GEO'), iProd = col('Products'), iUom = col('UOM'), iVal = col('VALUE')
if ([iDate, iGeo, iProd, iVal].includes(-1)) { console.error('Unexpected columns:', head.join(' | ')); process.exit(1) }

const monthIndex = (d) => { const [y, m] = d.split('-').map(Number); return y * 12 + (m - 1) }
const newest = rows.slice(1).reduce((mx, r) => (r[iDate] && r[iDate] > mx ? r[iDate] : mx), '')

// latest value per (geo, product)
const latest = new Map()
for (const r of rows.slice(1)) {
  const v = parseFloat(r[iVal])
  if (!r[iDate] || !Number.isFinite(v)) continue
  if (iUom !== -1 && r[iUom] && !/dollar/i.test(r[iUom])) continue
  const key = `${r[iGeo]}||${r[iProd]}`
  const prev = latest.get(key)
  if (!prev || r[iDate] > prev.date) latest.set(key, { geo: r[iGeo], product: r[iProd], date: r[iDate], price: v })
}

const out = []
const unmapped = new Set()
for (const { geo, product, date, price } of latest.values()) {
  if (monthIndex(newest) - monthIndex(date) > MAX_AGE_MONTHS) continue
  const { label, unit } = parseProduct(product)
  const base = cleanKey(label)
  // "Bread, white" -> also "white bread"; explicit aliases add shopper wording.
  const reversed = base.includes(',') ? base.split(',').map((p) => p.trim()).reverse().join(' ') : null
  const keys = [...new Set(ALIASES[base] ?? [reversed ?? base])]
  if (!unit) unmapped.add(product)
  const isNational = geo === 'Canada'
  for (const item of keys) {
    out.push({
      item, label, countryCode: 'CA', region: isNational ? null : geo, price, currency: 'CAD',
      unit, isDefault: false, period: date, source: SOURCE, sourceUrl: SOURCE_URL,
    })
  }
}

// Mark one default pack per (item, region): the DEFAULT_PACK size if listed, else the only size, else the median size.
const groups = new Map()
for (const r of out) { const k = `${r.item}||${r.region}`; (groups.get(k) ?? groups.set(k, []).get(k)).push(r) }
for (const g of groups.values()) {
  const want = DEFAULT_PACK[g[0].item]
  const pick = (want && g.find((r) => r.unit === want)) || (g.length === 1 ? g[0] : [...g].sort((a, b) => parseFloat(a.unit) - parseFloat(b.unit))[Math.floor(g.length / 2)])
  pick.isDefault = true
}

console.log(`Newest month in file: ${newest}. Rows to import: ${out.length}`)
const sk = out.filter((r) => r.region === 'Saskatchewan')
console.log(`\nSaskatchewan (${sk.length} rows):`)
for (const r of sk.sort((a, b) => a.item.localeCompare(b.item))) {
  console.log(`  ${r.isDefault ? '*' : ' '} ${r.item.padEnd(28)} $${r.price.toFixed(2).padStart(6)}  ${String(r.unit).padEnd(10)} (${r.label}, ${r.period})`)
}
if (unmapped.size) console.log(`\nProducts with no recognised pack size (stored without a unit):\n  ${[...unmapped].join('\n  ')}`)
console.log('\n* = default pack used when a list line has no unit')

if (dry) { console.log('\nDry run: nothing written.'); process.exit(0) }

const { PrismaClient } = await import('@prisma/client')
const { PrismaPg } = await import('@prisma/adapter-pg')
const pg = await import('pg')
const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
try {
  await prisma.typicalPrice.deleteMany({ where: { source: SOURCE, countryCode: 'CA' } })
  const res = await prisma.typicalPrice.createMany({ data: out })
  console.log(`\nImported ${res.count} Statistics Canada rows.`)
} finally {
  await prisma.$disconnect()
  await pool.end()
}
