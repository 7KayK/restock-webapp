// Resolves a shopper's market from the coarse "City, Region, Country" label
// that /api/location/reverse-geocode (or the manual city search) saves on
// User.locationLabel. The country is the last part of the label (Google's or
// OpenStreetMap's English country name), and it is matched against every
// country, so any place Google can locate gets a market: country code,
// currency, and the English tag Open Food Facts uses.
//
// Only a label whose country can't be matched returns null, and callers must
// then fall back to unscoped (global) behaviour rather than guess.
//
// Currency is the practical region key for Open Prices: its API ignores
// country filters but does honour `currency`. EUR and other currencies are
// shared by several countries, so callers should also filter on countryCode
// client-side where it matters.

export interface Region {
  // ISO 3166-1 alpha-2, upper case (e.g. 'CA', 'NG', 'GH').
  countryCode: string
  country: string
  // ISO 4217 currency code (e.g. 'CAD', 'NGN').
  currency: string
  // Open Food Facts country tag (English), used to scope product search.
  offCountryTag: string
  // Sub-national area as saved in the label (province / state / county), if any.
  region: string | null
  city: string | null
}

// ISO 3166-1 alpha-2 -> ISO 4217 currency. Rounded to the currency people
// actually pay with in shops (USD for dollarised economies).
const CURRENCY_BY_COUNTRY = `
AD:EUR AE:AED AF:AFN AG:XCD AL:ALL AM:AMD AO:AOA AR:ARS AT:EUR AU:AUD AZ:AZN
BA:BAM BB:BBD BD:BDT BE:EUR BF:XOF BG:BGN BH:BHD BI:BIF BJ:XOF BN:BND BO:BOB BR:BRL BS:BSD BT:BTN BW:BWP BY:BYN BZ:BZD
CA:CAD CD:CDF CF:XAF CG:XAF CH:CHF CI:XOF CL:CLP CM:XAF CN:CNY CO:COP CR:CRC CU:CUP CV:CVE CY:EUR CZ:CZK
DE:EUR DJ:DJF DK:DKK DM:XCD DO:DOP DZ:DZD
EC:USD EE:EUR EG:EGP ER:ERN ES:EUR ET:ETB
FI:EUR FJ:FJD FM:USD FR:EUR
GA:XAF GB:GBP GD:XCD GE:GEL GH:GHS GM:GMD GN:GNF GQ:XAF GR:EUR GT:GTQ GW:XOF GY:GYD
HK:HKD HN:HNL HR:EUR HT:HTG HU:HUF
ID:IDR IE:EUR IL:ILS IN:INR IQ:IQD IR:IRR IS:ISK IT:EUR
JM:JMD JO:JOD JP:JPY
KE:KES KG:KGS KH:KHR KI:AUD KM:KMF KN:XCD KP:KPW KR:KRW KW:KWD KZ:KZT
LA:LAK LB:LBP LC:XCD LI:CHF LK:LKR LR:LRD LS:LSL LT:EUR LU:EUR LV:EUR LY:LYD
MA:MAD MC:EUR MD:MDL ME:EUR MG:MGA MH:USD MK:MKD ML:XOF MM:MMK MN:MNT MO:MOP MR:MRU MT:EUR MU:MUR MV:MVR MW:MWK MX:MXN MY:MYR MZ:MZN
NA:NAD NE:XOF NG:NGN NI:NIO NL:EUR NO:NOK NP:NPR NR:AUD NZ:NZD
OM:OMR
PA:USD PE:PEN PG:PGK PH:PHP PK:PKR PL:PLN PR:USD PS:ILS PT:EUR PW:USD PY:PYG
QA:QAR
RO:RON RS:RSD RU:RUB RW:RWF
SA:SAR SB:SBD SC:SCR SD:SDG SE:SEK SG:SGD SI:EUR SK:EUR SL:SLE SM:EUR SN:XOF SO:SOS SR:SRD SS:SSP ST:STN SV:USD SY:SYP SZ:SZL
TD:XAF TG:XOF TH:THB TJ:TJS TL:USD TM:TMT TN:TND TO:TOP TR:TRY TT:TTD TV:AUD TW:TWD TZ:TZS
UA:UAH UG:UGX US:USD UY:UYU UZ:UZS
VA:EUR VC:XCD VE:VES VN:VND VU:VUV
WS:WST
XK:EUR
YE:YER
ZA:ZAR ZM:ZMW ZW:USD
`
  .trim()
  .split(/\s+/)
  .reduce<Record<string, string>>((acc, pair) => {
    const [cc, cur] = pair.split(':')
    acc[cc] = cur
    return acc
  }, {})

// Names Google / OpenStreetMap use that differ from the standard English name.
const EXTRA_ALIASES: Record<string, string> = {
  'united states of america': 'US',
  usa: 'US',
  us: 'US',
  uk: 'GB',
  'great britain': 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'northern ireland': 'GB',
  'republic of ireland': 'IE',
  'ivory coast': 'CI',
  'cote d ivoire': 'CI',
  turkey: 'TR',
  turkiye: 'TR',
  'czech republic': 'CZ',
  czechia: 'CZ',
  'south korea': 'KR',
  'korea south': 'KR',
  'republic of korea': 'KR',
  'north korea': 'KP',
  russia: 'RU',
  'russian federation': 'RU',
  vietnam: 'VN',
  'viet nam': 'VN',
  eswatini: 'SZ',
  swaziland: 'SZ',
  'cape verde': 'CV',
  'cabo verde': 'CV',
  'north macedonia': 'MK',
  macedonia: 'MK',
  macau: 'MO',
  macao: 'MO',
  'hong kong': 'HK',
  'palestinian territories': 'PS',
  palestine: 'PS',
  'the gambia': 'GM',
  gambia: 'GM',
  'the bahamas': 'BS',
  bahamas: 'BS',
  'timor leste': 'TL',
  'east timor': 'TL',
  laos: 'LA',
  brunei: 'BN',
  syria: 'SY',
  iran: 'IR',
  bolivia: 'BO',
  venezuela: 'VE',
  tanzania: 'TZ',
  moldova: 'MD',
  micronesia: 'FM',
  'vatican city': 'VA',
  'holy see': 'VA',
  myanmar: 'MM',
  burma: 'MM',
  'congo drc': 'CD',
  'democratic republic of the congo': 'CD',
  'dr congo': 'CD',
  'congo kinshasa': 'CD',
  'republic of the congo': 'CG',
  'congo republic': 'CG',
  'congo brazzaville': 'CG',
  kosovo: 'XK',
  'sao tome and principe': 'ST',
  'st kitts and nevis': 'KN',
  'st lucia': 'LC',
  'st vincent and the grenadines': 'VC',
  'antigua and barbuda': 'AG',
  'trinidad and tobago': 'TT',
  'bosnia and herzegovina': 'BA',
  'puerto rico': 'PR',
}

// Open Food Facts country tags that differ from the English display name.
const OFF_TAG_OVERRIDES: Record<string, string> = {
  TR: 'turkey',
  CI: 'ivory-coast',
  CD: 'democratic-republic-of-the-congo',
  CG: 'republic-of-the-congo',
  CZ: 'czech-republic',
  MK: 'north-macedonia',
  MM: 'myanmar',
  SZ: 'eswatini',
  CV: 'cape-verde',
  HK: 'hong-kong',
  MO: 'macau',
  PS: 'palestinian-territories',
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/^the\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

let nameToCode: Map<string, string> | null = null
let displayNames: Intl.DisplayNames | null = null

function englishName(code: string): string | null {
  try {
    displayNames ??= new Intl.DisplayNames(['en'], { type: 'region' })
    return displayNames.of(code) ?? null
  } catch {
    return null
  }
}

function lookupTable(): Map<string, string> {
  if (nameToCode) return nameToCode
  const map = new Map<string, string>()
  for (const code of Object.keys(CURRENCY_BY_COUNTRY)) {
    const name = englishName(code)
    if (name && name !== code) map.set(normalise(name), code)
  }
  for (const [alias, code] of Object.entries(EXTRA_ALIASES)) map.set(normalise(alias), code)
  nameToCode = map
  return map
}

export function parseRegion(label: string | null | undefined): Region | null {
  if (!label) return null
  const parts = label.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null

  const lastRaw = parts[parts.length - 1]
  // A bare ISO code ("NG") is accepted too.
  const asCode = /^[A-Za-z]{2}$/.test(lastRaw) ? lastRaw.toUpperCase() : null
  const code = lookupTable().get(normalise(lastRaw)) ?? (asCode && CURRENCY_BY_COUNTRY[asCode] ? asCode : null)
  if (!code) return null

  const currency = CURRENCY_BY_COUNTRY[code]
  if (!currency) return null
  const country = code === 'GB' ? 'United Kingdom' : englishName(code) ?? lastRaw

  return {
    countryCode: code,
    country,
    currency,
    offCountryTag: OFF_TAG_OVERRIDES[code] ?? normalise(country).replace(/\s+/g, '-'),
    city: parts.length >= 2 ? parts[0] : null,
    region: parts.length >= 3 ? parts[1] : null,
  }
}
