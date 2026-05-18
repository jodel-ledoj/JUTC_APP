/**
 * JUTC Route Scraper
 * Attempts to scrape route data from the JUTC website.
 * Falls back to hardcoded data if scraping fails.
 *
 * Usage:
 *   ts-node src/scripts/route-scraper.ts          # saves to DB
 *   ts-node src/scripts/route-scraper.ts --dry-run # prints only
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// ── Static fallback data (sourced from official JUTC schedules) ───────────────

interface ScrapedRoute {
  code: string;
  name: string;
  color: string;
  fare: number;
  frequencyMinutes: number;
  stops: Array<{ name: string; lat: number; lng: number; sequence: number }>;
}

const STATIC_ROUTES: ScrapedRoute[] = [
  {
    code: '22',
    name: 'Half Way Tree → Downtown',
    color: '#2F80ED',
    fare: 100,
    frequencyMinutes: 15,
    stops: [
      { name: 'Half Way Tree Terminal', lat: 17.9945, lng: -76.7991, sequence: 1 },
      { name: 'Crossroads', lat: 17.9883, lng: -76.7892, sequence: 2 },
      { name: 'New Kingston', lat: 17.9935, lng: -76.7835, sequence: 3 },
      { name: 'Downtown Kingston', lat: 17.9992, lng: -76.7934, sequence: 4 },
      { name: 'Parade', lat: 17.9981, lng: -76.7942, sequence: 5 },
    ],
  },
  {
    code: '45',
    name: 'Papine → Downtown',
    color: '#9B51E0',
    fare: 100,
    frequencyMinutes: 20,
    stops: [
      { name: 'Papine', lat: 17.9848, lng: -76.7380, sequence: 1 },
      { name: 'Mona', lat: 17.9897, lng: -76.7512, sequence: 2 },
      { name: 'UWI Campus', lat: 17.9984, lng: -76.7435, sequence: 3 },
      { name: 'Half Way Tree', lat: 17.9945, lng: -76.7991, sequence: 4 },
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 5 },
    ],
  },
  {
    code: '21',
    name: "Matilda's Corner → Downtown",
    color: '#27AE60',
    fare: 100,
    frequencyMinutes: 20,
    stops: [
      { name: "Matilda's Corner", lat: 18.0310, lng: -76.8170, sequence: 1 },
      { name: 'Constant Spring', lat: 18.0098, lng: -76.7994, sequence: 2 },
      { name: 'Half Way Tree', lat: 17.9945, lng: -76.7991, sequence: 3 },
      { name: 'Crossroads', lat: 17.9883, lng: -76.7892, sequence: 4 },
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 5 },
    ],
  },
  {
    code: '23',
    name: 'Barbican → Downtown',
    color: '#F2994A',
    fare: 100,
    frequencyMinutes: 18,
    stops: [
      { name: 'Barbican', lat: 17.9992, lng: -76.7730, sequence: 1 },
      { name: 'Liguanea', lat: 17.9972, lng: -76.7791, sequence: 2 },
      { name: 'Half Way Tree', lat: 17.9945, lng: -76.7991, sequence: 3 },
      { name: 'Crossroads', lat: 17.9883, lng: -76.7892, sequence: 4 },
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 5 },
    ],
  },
  {
    code: '35',
    name: 'Portmore → Downtown',
    color: '#EB5757',
    fare: 120,
    frequencyMinutes: 12,
    stops: [
      { name: 'Portmore', lat: 17.9538, lng: -76.8870, sequence: 1 },
      { name: 'Gregory Park', lat: 17.9578, lng: -76.8950, sequence: 2 },
      { name: 'Caymanas', lat: 17.9700, lng: -76.8700, sequence: 3 },
      { name: 'Spanish Town Road', lat: 17.9850, lng: -76.8100, sequence: 4 },
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 5 },
    ],
  },
  {
    code: '36',
    name: 'Spanish Town → Downtown',
    color: '#F7C137',
    fare: 150,
    frequencyMinutes: 25,
    stops: [
      { name: 'Spanish Town', lat: 17.9910, lng: -76.9551, sequence: 1 },
      { name: 'Caymanas', lat: 17.9876, lng: -76.8945, sequence: 2 },
      { name: 'Old Harbour Road', lat: 17.9800, lng: -76.8500, sequence: 3 },
      { name: 'Portmore', lat: 17.9538, lng: -76.8870, sequence: 4 },
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 5 },
    ],
  },
  {
    code: '73',
    name: 'Waterford → Half Way Tree',
    color: '#56CCF2',
    fare: 120,
    frequencyMinutes: 25,
    stops: [
      { name: 'Waterford', lat: 17.9604, lng: -76.8810, sequence: 1 },
      { name: 'Portmore Mall', lat: 17.9580, lng: -76.8740, sequence: 2 },
      { name: 'Ferry', lat: 17.9699, lng: -76.8592, sequence: 3 },
      { name: 'Caymanas', lat: 17.9700, lng: -76.8700, sequence: 4 },
      { name: 'Half Way Tree', lat: 17.9945, lng: -76.7991, sequence: 5 },
    ],
  },
  {
    code: '10',
    name: 'Downtown → Harbour View',
    color: '#219653',
    fare: 100,
    frequencyMinutes: 20,
    stops: [
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 1 },
      { name: 'Rockfort', lat: 17.9752, lng: -76.7598, sequence: 2 },
      { name: 'Harbour View', lat: 17.9655, lng: -76.7238, sequence: 3 },
      { name: 'Bull Bay', lat: 17.9438, lng: -76.6835, sequence: 4 },
    ],
  },
  {
    code: '24',
    name: 'Duhaney Park → Downtown',
    color: '#BB6BD9',
    fare: 100,
    frequencyMinutes: 18,
    stops: [
      { name: 'Duhaney Park', lat: 17.9805, lng: -76.7798, sequence: 1 },
      { name: 'Hagley Park', lat: 17.9855, lng: -76.8042, sequence: 2 },
      { name: 'Crossroads', lat: 17.9883, lng: -76.7892, sequence: 3 },
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 4 },
    ],
  },
  {
    code: '20',
    name: 'Stony Hill → Downtown',
    color: '#6FCF97',
    fare: 120,
    frequencyMinutes: 30,
    stops: [
      { name: 'Stony Hill', lat: 18.0685, lng: -76.7850, sequence: 1 },
      { name: 'Constant Spring', lat: 18.0098, lng: -76.7994, sequence: 2 },
      { name: 'Half Way Tree', lat: 17.9945, lng: -76.7991, sequence: 3 },
      { name: 'Downtown Kingston', lat: 17.9977, lng: -76.7943, sequence: 4 },
    ],
  },
];

// ── Simple HTTP fetch helper (no external deps) ───────────────────────────────

function fetchPage(url: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── Scrape attempt ────────────────────────────────────────────────────────────

async function scrapeJUTCWebsite(): Promise<ScrapedRoute[] | null> {
  const JUTC_URL = 'https://www.jutcbus.com/routes';
  console.log(`Attempting to scrape ${JUTC_URL}...`);
  try {
    const html = await fetchPage(JUTC_URL);
    // Very basic check: if the page returned meaningful content
    if (html.length < 500 || !html.includes('<')) {
      console.log('Site returned invalid response, using static data.');
      return null;
    }
    // JUTC website doesn't expose structured route data publicly.
    // A real implementation would parse the HTML here.
    console.log('Site accessible but no parseable route table found. Using static data.');
    return null;
  } catch (err: any) {
    console.log(`Could not reach JUTC website (${err.message}). Using static data.`);
    return null;
  }
}

// ── Save to DB ────────────────────────────────────────────────────────────────

async function saveRoutesToDB(routes: ScrapedRoute[]): Promise<void> {
  console.log(`\nSaving ${routes.length} routes to database...`);

  for (const r of routes) {
    const route = await prisma.route.upsert({
      where: { code: r.code },
      update: { name: r.name, color: r.color, isActive: true },
      create: { code: r.code, name: r.name, color: r.color, isActive: true },
    });
    console.log(`  [${r.code}] ${r.name} — upserted`);

    for (const s of r.stops) {
      const stopCode = `STOP-${r.code}-${s.sequence}`;
      const stop = await prisma.stop.upsert({
        where: { code: stopCode },
        update: { name: s.name, latitude: s.lat, longitude: s.lng },
        create: { code: stopCode, name: s.name, latitude: s.lat, longitude: s.lng },
      });

      const existing = await prisma.routeStop.findFirst({
        where: { routeId: route.id, stopId: stop.id },
      });
      if (!existing) {
        await prisma.routeStop.create({
          data: { routeId: route.id, stopId: stop.id, sequence: s.sequence },
        });
      }
    }
  }

  console.log(`\nDone. ${routes.length} routes saved.`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function scrapeRoutes(): Promise<ScrapedRoute[]> {
  const scraped = await scrapeJUTCWebsite();
  return scraped ?? STATIC_ROUTES;
}

async function main() {
  console.log('JUTC Route Scraper');
  console.log('==================');
  if (DRY_RUN) console.log('DRY RUN — no DB writes\n');

  const routes = await scrapeRoutes();
  console.log(`\nFound ${routes.length} routes:`);
  for (const r of routes) {
    console.log(`  [${r.code}] ${r.name} — ${r.stops.length} stops`);
  }

  if (!DRY_RUN) {
    await saveRoutesToDB(routes);
  }

  await prisma.$disconnect();
  console.log('\nScraper complete.');
}

main().catch((e) => {
  console.error('Scraper failed:', e);
  process.exit(1);
});
