/**
 * JUTC GPS Demo Simulator
 * Simulates buses moving along real Kingston routes for demo purposes.
 * Broadcasts live GPS updates via the existing gps service → Socket.io.
 *
 * Usage:
 *   ts-node src/scripts/gps-simulator.ts
 *
 * Requires backend .env and running PostgreSQL + Redis.
 */

import 'dotenv/config';
import { PrismaClient, BusStatus, TripStatus } from '@prisma/client';
import { redis } from '../config/redis';
import { ingestGPS } from '../services/gps.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// ── Route coordinate paths ────────────────────────────────────────────────────

interface LatLng { lat: number; lng: number; }

const DEMO_ROUTES: Array<{ code: string; name: string; coords: LatLng[] }> = [
  { code: '22', name: 'Half Way Tree → Downtown', coords: [
    { lat: 17.9945, lng: -76.7991 },
    { lat: 17.9930, lng: -76.7970 },
    { lat: 17.9910, lng: -76.7950 },
    { lat: 17.9883, lng: -76.7892 },
    { lat: 17.9900, lng: -76.7870 },
    { lat: 17.9920, lng: -76.7850 },
    { lat: 17.9935, lng: -76.7835 },
    { lat: 17.9955, lng: -76.7900 },
    { lat: 17.9970, lng: -76.7920 },
    { lat: 17.9992, lng: -76.7934 },
    { lat: 17.9981, lng: -76.7942 },
  ]},
  { code: '45', name: 'Papine → Downtown', coords: [
    { lat: 17.9848, lng: -76.7380 },
    { lat: 17.9860, lng: -76.7420 },
    { lat: 17.9897, lng: -76.7512 },
    { lat: 17.9920, lng: -76.7600 },
    { lat: 17.9940, lng: -76.7700 },
    { lat: 17.9945, lng: -76.7991 },
    { lat: 17.9960, lng: -76.7960 },
    { lat: 17.9977, lng: -76.7943 },
  ]},
  { code: '21', name: "Matilda's Corner → Downtown", coords: [
    { lat: 18.0310, lng: -76.8170 },
    { lat: 18.0200, lng: -76.8100 },
    { lat: 18.0098, lng: -76.7994 },
    { lat: 18.0000, lng: -76.7990 },
    { lat: 17.9945, lng: -76.7991 },
    { lat: 17.9883, lng: -76.7892 },
    { lat: 17.9950, lng: -76.7920 },
    { lat: 17.9977, lng: -76.7943 },
  ]},
  { code: '23', name: 'Barbican → Downtown', coords: [
    { lat: 17.9992, lng: -76.7730 },
    { lat: 17.9980, lng: -76.7760 },
    { lat: 17.9972, lng: -76.7791 },
    { lat: 17.9960, lng: -76.7850 },
    { lat: 17.9945, lng: -76.7991 },
    { lat: 17.9883, lng: -76.7892 },
    { lat: 17.9977, lng: -76.7943 },
  ]},
  { code: '35', name: 'Portmore → Downtown', coords: [
    { lat: 17.9538, lng: -76.8870 },
    { lat: 17.9578, lng: -76.8950 },
    { lat: 17.9620, lng: -76.8800 },
    { lat: 17.9700, lng: -76.8700 },
    { lat: 17.9780, lng: -76.8400 },
    { lat: 17.9850, lng: -76.8100 },
    { lat: 17.9900, lng: -76.7943 },
    { lat: 17.9977, lng: -76.7943 },
  ]},
  { code: '36', name: 'Spanish Town → Downtown', coords: [
    { lat: 17.9910, lng: -76.9551 },
    { lat: 17.9876, lng: -76.8945 },
    { lat: 17.9820, lng: -76.8700 },
    { lat: 17.9800, lng: -76.8500 },
    { lat: 17.9538, lng: -76.8870 },
    { lat: 17.9700, lng: -76.8700 },
    { lat: 17.9850, lng: -76.8100 },
    { lat: 17.9977, lng: -76.7943 },
  ]},
  { code: '73', name: 'Waterford → Half Way Tree', coords: [
    { lat: 17.9604, lng: -76.8810 },
    { lat: 17.9580, lng: -76.8740 },
    { lat: 17.9640, lng: -76.8650 },
    { lat: 17.9699, lng: -76.8592 },
    { lat: 17.9700, lng: -76.8700 },
    { lat: 17.9780, lng: -76.8400 },
    { lat: 17.9870, lng: -76.8100 },
    { lat: 17.9945, lng: -76.7991 },
  ]},
  { code: '10', name: 'Downtown → Harbour View', coords: [
    { lat: 17.9977, lng: -76.7943 },
    { lat: 17.9900, lng: -76.7800 },
    { lat: 17.9820, lng: -76.7700 },
    { lat: 17.9752, lng: -76.7598 },
    { lat: 17.9700, lng: -76.7450 },
    { lat: 17.9655, lng: -76.7238 },
    { lat: 17.9550, lng: -76.7050 },
    { lat: 17.9438, lng: -76.6835 },
  ]},
  { code: '24', name: 'Duhaney Park → Downtown', coords: [
    { lat: 17.9805, lng: -76.7798 },
    { lat: 17.9830, lng: -76.7900 },
    { lat: 17.9855, lng: -76.8042 },
    { lat: 17.9870, lng: -76.7980 },
    { lat: 17.9883, lng: -76.7892 },
    { lat: 17.9920, lng: -76.7920 },
    { lat: 17.9977, lng: -76.7943 },
  ]},
  { code: '20', name: 'Stony Hill → Downtown', coords: [
    { lat: 18.0685, lng: -76.7850 },
    { lat: 18.0450, lng: -76.7900 },
    { lat: 18.0200, lng: -76.7950 },
    { lat: 18.0098, lng: -76.7994 },
    { lat: 17.9945, lng: -76.7991 },
    { lat: 17.9883, lng: -76.7892 },
    { lat: 17.9977, lng: -76.7943 },
  ]},
];

// ── Utility functions ─────────────────────────────────────────────────────────

function bearing(a: LatLng, b: LatLng): number {
  const dLng = b.lng - a.lng;
  const dLat = b.lat - a.lat;
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  return (angle + 360) % 360;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

// ── Bus state ─────────────────────────────────────────────────────────────────

interface SimBus {
  busId: string;
  tripId: string;
  routeCode: string;
  coords: LatLng[];
  segmentIndex: number;   // which segment (0..coords.length-2)
  progress: number;       // 0..1 within current segment
  direction: 1 | -1;     // pendulum: 1=forward, -1=backward
  speed: number;          // km/h
  passengerCount: number;
}

const activeBuses: SimBus[] = [];
const INTERVAL_MS = 8000;

// ── Setup buses in DB ─────────────────────────────────────────────────────────

async function setupBuses(): Promise<void> {
  console.log('[Simulator] Setting up demo buses...');

  const depot = await prisma.depot.findFirst();
  if (!depot) {
    console.error('[Simulator] No depot found. Run seed first.');
    process.exit(1);
  }

  for (let i = 0; i < DEMO_ROUTES.length; i++) {
    const demoRoute = DEMO_ROUTES[i];
    const plateNumber = `SIM-${demoRoute.code.padStart(3, '0')}`;

    // Ensure route exists in DB
    const dbRoute = await prisma.route.findFirst({ where: { code: demoRoute.code } });
    if (!dbRoute) {
      console.warn(`[Simulator] Route ${demoRoute.code} not in DB. Run seed/scraper first.`);
      continue;
    }

    // Ensure bus exists
    const bus = await prisma.bus.upsert({
      where: { plateNumber },
      update: { status: BusStatus.IN_SERVICE },
      create: {
        plateNumber,
        capacity: 78,
        depotId: depot.id,
        status: BusStatus.IN_SERVICE,
        odometerKm: 10000 + i * 5000,
        lastServiceKm: 8000 + i * 5000,
        year: 2022,
        make: 'Volvo',
        model: 'B7R',
      },
    });

    // Cancel any previous simulator trips
    await prisma.trip.updateMany({
      where: { busId: bus.id, status: { in: ['SCHEDULED', 'EN_ROUTE'] } },
      data: { status: TripStatus.CANCELLED, completedAt: new Date() },
    });

    // Find a driver for the trip (cycle through available drivers)
    const drivers = await prisma.user.findMany({ where: { role: 'DRIVER' } });
    const driver = drivers[i % drivers.length];

    if (!driver) {
      console.warn('[Simulator] No drivers found. Run seed first.');
      continue;
    }

    // Create new trip
    const trip = await prisma.trip.create({
      data: {
        busId: bus.id,
        driverId: driver.id,
        routeId: dbRoute.id,
        status: TripStatus.EN_ROUTE,
        currentStopSeq: 1,
        scheduledDeparture: new Date(),
        actualDeparture: new Date(),
      },
    });

    // Stagger start positions so buses are spread across the route
    const startSegment = Math.floor((i / DEMO_ROUTES.length) * (demoRoute.coords.length - 1));

    activeBuses.push({
      busId: bus.id,
      tripId: trip.id,
      routeCode: demoRoute.code,
      coords: demoRoute.coords,
      segmentIndex: startSegment,
      progress: Math.random(),
      direction: 1,
      speed: 20 + Math.random() * 15,
      passengerCount: Math.floor(10 + Math.random() * 50),
    });

    console.log(`[Simulator] Bus ${plateNumber} on route ${demoRoute.code} — ready`);
  }

  console.log(`[Simulator] ${activeBuses.length} buses initialized.\n`);
}

// ── Tick: advance each bus one step ──────────────────────────────────────────

async function tick(): Promise<void> {
  const promises = activeBuses.map(async (bus) => {
    const { coords } = bus;
    const maxSeg = coords.length - 2;

    // Advance progress within current segment
    const segDistKm = haversineKm(coords[bus.segmentIndex], coords[bus.segmentIndex + 1]);
    const stepKm = (bus.speed / 3600) * (INTERVAL_MS / 1000);
    bus.progress += segDistKm > 0 ? stepKm / segDistKm : 0.1;

    // Add slight speed variation
    bus.speed = Math.max(15, Math.min(45, bus.speed + (Math.random() - 0.5) * 3));

    // Move to next segment when progress >= 1
    if (bus.progress >= 1) {
      bus.progress = 0;
      bus.segmentIndex += bus.direction;

      if (bus.segmentIndex > maxSeg) {
        bus.direction = -1;
        bus.segmentIndex = maxSeg;
        bus.passengerCount = Math.floor(5 + Math.random() * 30);
      } else if (bus.segmentIndex < 0) {
        bus.direction = 1;
        bus.segmentIndex = 0;
        bus.passengerCount = Math.floor(15 + Math.random() * 50);
      }
    }

    // Current position
    const pos = interpolate(
      coords[bus.segmentIndex],
      coords[Math.min(bus.segmentIndex + 1, coords.length - 1)],
      Math.min(bus.progress, 1),
    );

    const head = bearing(coords[bus.segmentIndex], coords[Math.min(bus.segmentIndex + 1, coords.length - 1)]);

    try {
      await ingestGPS({
        busId: bus.busId,
        tripId: bus.tripId,
        latitude: pos.lat,
        longitude: pos.lng,
        speed: Math.round(bus.speed * 10) / 10,
        heading: Math.round(head),
      });
    } catch (err: any) {
      logger.warn(`[Simulator] GPS ingest failed for ${bus.routeCode}: ${err.message}`);
    }
  });

  await Promise.allSettled(promises);
}

// ── Main ──────────────────────────────────────────────────────────────────────

let tickCount = 0;

async function main() {
  console.log('========================================');
  console.log('  JUTC GPS Demo Simulator');
  console.log('  Simulating live bus movement...');
  console.log('========================================\n');

  await setupBuses();

  if (activeBuses.length === 0) {
    console.error('[Simulator] No buses to simulate. Exiting.');
    process.exit(1);
  }

  console.log('[Simulator] Starting GPS broadcast loop...');
  console.log(`[Simulator] Update interval: ${INTERVAL_MS / 1000}s\n`);

  // Initial tick immediately
  await tick();
  tickCount++;

  const interval = setInterval(async () => {
    try {
      await tick();
      tickCount++;

      if (tickCount % Math.round(30000 / INTERVAL_MS) === 0) {
        console.log(`[Simulator] ${new Date().toLocaleTimeString()} — ${activeBuses.length} buses active, ${tickCount} updates sent`);
      }
    } catch (err: any) {
      logger.error('[Simulator] Tick error:', err.message);
    }
  }, INTERVAL_MS);

  // Graceful shutdown
  const cleanup = async () => {
    console.log('\n[Simulator] Shutting down...');
    clearInterval(interval);

    for (const bus of activeBuses) {
      await prisma.bus.update({
        where: { id: bus.busId },
        data: { status: BusStatus.DEPOT },
      }).catch(() => {});

      await prisma.trip.update({
        where: { id: bus.tripId },
        data: { status: TripStatus.COMPLETED, completedAt: new Date() },
      }).catch(() => {});
    }

    await redis.quit();
    await prisma.$disconnect();
    console.log('[Simulator] Stopped.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('[Simulator] Fatal error:', err);
  process.exit(1);
});
