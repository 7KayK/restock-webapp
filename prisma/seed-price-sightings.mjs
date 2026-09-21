// Seeds sample PriceSighting rows so "Find prices near me" / "Make a cart"
// have something to show during testing, without waiting on real
// crowdsourced reports. These are realistic but MADE-UP prices for common
// grocery items across a handful of real Regina, SK grocery banners
// (your primary test market) — not scraped, not live.
//
// Marked with source: 'seed' so they're easy to tell apart from real
// reports and safe to clear later. Re-running this script is safe: it
// deletes any existing seed rows first, so it never piles up duplicates.
//
// Run from the project root:
//   node --env-file=.env prisma/seed-price-sightings.mjs
// (If that errors that DATABASE_URL is missing, your env var might live in
// .env.local instead — try: node --env-file=.env.local prisma/seed-price-sightings.mjs)

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CURRENCY = 'CAD'

// item, storeName, price, unit — a handful of stores per item, deliberately
// not every store for every item, so the "which store covers the most of
// your list" ranking has something real to differentiate on.
const SIGHTINGS = [
  // milk (4L)
  { item: 'milk', storeName: 'Real Canadian Superstore', price: 5.49, unit: '4L' },
  { item: 'milk', storeName: 'Safeway', price: 5.99, unit: '4L' },
  { item: 'milk', storeName: 'Co-op Food Store', price: 5.79, unit: '4L' },
  { item: 'milk', storeName: 'Walmart Supercentre', price: 5.29, unit: '4L' },

  // eggs (dozen)
  { item: 'eggs', storeName: 'Real Canadian Superstore', price: 4.99, unit: 'dozen' },
  { item: 'eggs', storeName: 'Safeway', price: 5.49, unit: 'dozen' },
  { item: 'eggs', storeName: 'Walmart Supercentre', price: 4.79, unit: 'dozen' },

  // bread (loaf)
  { item: 'bread', storeName: 'Real Canadian Superstore', price: 3.49, unit: 'loaf' },
  { item: 'bread', storeName: 'Co-op Food Store', price: 3.79, unit: 'loaf' },
  { item: 'bread', storeName: 'Walmart Supercentre', price: 2.97, unit: 'loaf' },
  { item: 'bread', storeName: 'No Frills', price: 2.89, unit: 'loaf' },

  // bananas (lb)
  { item: 'bananas', storeName: 'Real Canadian Superstore', price: 0.69, unit: 'lb' },
  { item: 'bananas', storeName: 'Safeway', price: 0.79, unit: 'lb' },
  { item: 'bananas', storeName: 'No Frills', price: 0.59, unit: 'lb' },

  // chicken breast (lb)
  { item: 'chicken breast', storeName: 'Real Canadian Superstore', price: 6.99, unit: 'lb' },
  { item: 'chicken breast', storeName: 'Safeway', price: 7.99, unit: 'lb' },
  { item: 'chicken breast', storeName: 'Co-op Food Store', price: 7.49, unit: 'lb' },

  // ground beef (lb)
  { item: 'ground beef', storeName: 'Real Canadian Superstore', price: 6.49, unit: 'lb' },
  { item: 'ground beef', storeName: 'Walmart Supercentre', price: 5.97, unit: 'lb' },
  { item: 'ground beef', storeName: 'No Frills', price: 5.79, unit: 'lb' },

  // rice (2kg)
  { item: 'rice', storeName: 'Real Canadian Superstore', price: 6.99, unit: '2kg' },
  { item: 'rice', storeName: 'Co-op Food Store', price: 7.49, unit: '2kg' },
  { item: 'rice', storeName: 'Walmart Supercentre', price: 6.47, unit: '2kg' },

  // pasta (900g)
  { item: 'pasta', storeName: 'Real Canadian Superstore', price: 2.49, unit: '900g' },
  { item: 'pasta', storeName: 'Safeway', price: 2.99, unit: '900g' },
  { item: 'pasta', storeName: 'No Frills', price: 1.99, unit: '900g' },

  // tomatoes (lb)
  { item: 'tomatoes', storeName: 'Real Canadian Superstore', price: 2.49, unit: 'lb' },
  { item: 'tomatoes', storeName: 'Co-op Food Store', price: 2.79, unit: 'lb' },
  { item: 'tomatoes', storeName: 'Walmart Supercentre', price: 2.27, unit: 'lb' },

  // onions (lb)
  { item: 'onions', storeName: 'Real Canadian Superstore', price: 1.29, unit: 'lb' },
  { item: 'onions', storeName: 'Safeway', price: 1.49, unit: 'lb' },
  { item: 'onions', storeName: 'No Frills', price: 0.99, unit: 'lb' },

  // apples (lb)
  { item: 'apples', storeName: 'Real Canadian Superstore', price: 1.79, unit: 'lb' },
  { item: 'apples', storeName: 'Safeway', price: 1.99, unit: 'lb' },
  { item: 'apples', storeName: 'Co-op Food Store', price: 1.89, unit: 'lb' },

  // cheese (400g)
  { item: 'cheese', storeName: 'Real Canadian Superstore', price: 5.99, unit: '400g' },
  { item: 'cheese', storeName: 'Safeway', price: 6.49, unit: '400g' },
  { item: 'cheese', storeName: 'Walmart Supercentre', price: 5.47, unit: '400g' },

  // yogurt (650g)
  { item: 'yogurt', storeName: 'Real Canadian Superstore', price: 4.29, unit: '650g' },
  { item: 'yogurt', storeName: 'Co-op Food Store', price: 4.59, unit: '650g' },
  { item: 'yogurt', storeName: 'No Frills', price: 3.99, unit: '650g' },

  // butter (454g)
  { item: 'butter', storeName: 'Real Canadian Superstore', price: 5.99, unit: '454g' },
  { item: 'butter', storeName: 'Safeway', price: 6.49, unit: '454g' },
  { item: 'butter', storeName: 'Walmart Supercentre', price: 5.77, unit: '454g' },

  // coffee (340g)
  { item: 'coffee', storeName: 'Real Canadian Superstore', price: 8.99, unit: '340g' },
  { item: 'coffee', storeName: 'Safeway', price: 9.99, unit: '340g' },
  { item: 'coffee', storeName: 'Co-op Food Store', price: 9.49, unit: '340g' },
]

async function main() {
  const deleted = await prisma.priceSighting.deleteMany({ where: { source: 'seed' } })
  console.log(`Cleared ${deleted.count} previous seed sighting(s).`)

  const created = await prisma.priceSighting.createMany({
    data: SIGHTINGS.map((s) => ({
      item: s.item,
      storeName: s.storeName,
      price: s.price,
      currency: CURRENCY,
      unit: s.unit,
      source: 'seed',
    })),
  })
  console.log(`Inserted ${created.count} sample price sighting(s) across ${SIGHTINGS.length} rows.`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
