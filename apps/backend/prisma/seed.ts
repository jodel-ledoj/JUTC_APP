import { PrismaClient, UserRole, BusStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Route definitions — matches mobile jutcRoutes.ts codes exactly
// ---------------------------------------------------------------------------

interface StopDef {
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteDef {
  code: string;
  name: string;
  color: string;
  stops: StopDef[];
}

const ROUTES: RouteDef[] = [
  {
    code: '22',
    name: 'Half Way Tree → Downtown',
    color: '#2F80ED',
    stops: [
      { name: 'Half Way Tree Terminal', latitude: 17.9945, longitude: -76.7991 },
      { name: 'Crossroads',             latitude: 17.9883, longitude: -76.7892 },
      { name: 'New Kingston',           latitude: 17.9935, longitude: -76.7835 },
      { name: 'Downtown Kingston',      latitude: 17.9992, longitude: -76.7934 },
      { name: 'Parade',                 latitude: 17.9981, longitude: -76.7942 },
    ],
  },
  {
    code: '45',
    name: 'Papine → Downtown',
    color: '#9B51E0',
    stops: [
      { name: 'Papine',        latitude: 17.9848, longitude: -76.7380 },
      { name: 'Mona',          latitude: 17.9897, longitude: -76.7512 },
      { name: 'UWI Campus',    latitude: 17.9984, longitude: -76.7435 },
      { name: 'Half Way Tree', latitude: 17.9945, longitude: -76.7991 },
      { name: 'Downtown',      latitude: 17.9977, longitude: -76.7943 },
    ],
  },
  {
    code: '21',
    name: 'Matilda Corner → Downtown',
    color: '#27AE60',
    stops: [
      { name: 'Matilda Corner',  latitude: 18.0310, longitude: -76.8170 },
      { name: 'Constant Spring', latitude: 18.0098, longitude: -76.7994 },
      { name: 'Half Way Tree',   latitude: 17.9945, longitude: -76.7991 },
      { name: 'Crossroads',      latitude: 17.9883, longitude: -76.7892 },
      { name: 'Downtown',        latitude: 17.9977, longitude: -76.7943 },
    ],
  },
  {
    code: '23',
    name: 'Barbican → Downtown',
    color: '#F2994A',
    stops: [
      { name: 'Barbican',      latitude: 17.9992, longitude: -76.7730 },
      { name: 'Liguanea',      latitude: 17.9972, longitude: -76.7791 },
      { name: 'Half Way Tree', latitude: 17.9945, longitude: -76.7991 },
      { name: 'Crossroads',    latitude: 17.9883, longitude: -76.7892 },
      { name: 'Downtown',      latitude: 17.9977, longitude: -76.7943 },
    ],
  },
  {
    code: '35',
    name: 'Portmore → Downtown',
    color: '#EB5757',
    stops: [
      { name: 'Portmore',          latitude: 17.9538, longitude: -76.8870 },
      { name: 'Gregory Park',      latitude: 17.9578, longitude: -76.8950 },
      { name: 'Caymanas',          latitude: 17.9700, longitude: -76.8700 },
      { name: 'Spanish Town Road', latitude: 17.9850, longitude: -76.8100 },
      { name: 'Downtown',          latitude: 17.9977, longitude: -76.7943 },
    ],
  },
  {
    code: '36',
    name: 'Spanish Town → Downtown',
    color: '#F7C137',
    stops: [
      { name: 'Spanish Town',    latitude: 17.9910, longitude: -76.9551 },
      { name: 'Caymanas',        latitude: 17.9876, longitude: -76.8945 },
      { name: 'Old Harbour Road', latitude: 17.9800, longitude: -76.8500 },
      { name: 'Portmore',        latitude: 17.9538, longitude: -76.8870 },
      { name: 'Downtown',        latitude: 17.9977, longitude: -76.7943 },
    ],
  },
  {
    code: '73',
    name: 'Waterford → Half Way Tree',
    color: '#56CCF2',
    stops: [
      { name: 'Waterford',     latitude: 17.9604, longitude: -76.8810 },
      { name: 'Portmore Mall', latitude: 17.9580, longitude: -76.8740 },
      { name: 'Ferry',         latitude: 17.9699, longitude: -76.8592 },
      { name: 'Caymanas',      latitude: 17.9700, longitude: -76.8700 },
      { name: 'Half Way Tree', latitude: 17.9945, longitude: -76.7991 },
    ],
  },
  {
    code: '10',
    name: 'Downtown → Harbour View',
    color: '#219653',
    stops: [
      { name: 'Downtown',     latitude: 17.9977, longitude: -76.7943 },
      { name: 'Rockfort',     latitude: 17.9752, longitude: -76.7598 },
      { name: 'Harbour View', latitude: 17.9655, longitude: -76.7238 },
      { name: 'Bull Bay',     latitude: 17.9438, longitude: -76.6835 },
    ],
  },
  {
    code: '24',
    name: 'Duhaney Park → Downtown',
    color: '#BB6BD9',
    stops: [
      { name: 'Duhaney Park', latitude: 17.9805, longitude: -76.7798 },
      { name: 'Hagley Park',  latitude: 17.9855, longitude: -76.8042 },
      { name: 'Crossroads',   latitude: 17.9883, longitude: -76.7892 },
      { name: 'Downtown',     latitude: 17.9977, longitude: -76.7943 },
    ],
  },
  {
    code: '20',
    name: 'Stony Hill → Downtown',
    color: '#6FCF97',
    stops: [
      { name: 'Stony Hill',    latitude: 18.0685, longitude: -76.7850 },
      { name: 'Constant Spring', latitude: 18.0098, longitude: -76.7994 },
      { name: 'Half Way Tree', latitude: 17.9945, longitude: -76.7991 },
      { name: 'Downtown',      latitude: 17.9977, longitude: -76.7943 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Bus fleet — PA 1001 to PA 1012
// ---------------------------------------------------------------------------

const BUSES = [
  { plateNumber: 'PA 1001', capacity: 78 },
  { plateNumber: 'PA 1002', capacity: 78 },
  { plateNumber: 'PA 1003', capacity: 78 },
  { plateNumber: 'PA 1004', capacity: 78 },
  { plateNumber: 'PA 1005', capacity: 52 },
  { plateNumber: 'PA 1006', capacity: 52 },
  { plateNumber: 'PA 1007', capacity: 52 },
  { plateNumber: 'PA 1008', capacity: 52 },
  { plateNumber: 'PA 1009', capacity: 60 },
  { plateNumber: 'PA 1010', capacity: 60 },
  { plateNumber: 'PA 1011', capacity: 60 },
  { plateNumber: 'PA 1012', capacity: 60 },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { phone: '+18765550001' },
    update: {},
    create: {
      phone: '+18765550001',
      password: adminPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
    },
  });
  console.log('Admin user:', admin.phone);

  // Executive user
  const execPassword = await bcrypt.hash('Exec@1234', 12);
  const exec = await prisma.user.upsert({
    where: { phone: '+18765550002' },
    update: {},
    create: {
      phone: '+18765550002',
      password: execPassword,
      name: 'CEO JUTC',
      role: UserRole.EXECUTIVE,
    },
  });
  console.log('Executive user:', exec.phone);

  // Driver — Marcus Brown
  const marcusPassword = await bcrypt.hash('Driver@1234', 12);
  const driverMarcus = await prisma.user.upsert({
    where: { phone: '+18765550010' },
    update: {},
    create: {
      phone: '+18765550010',
      password: marcusPassword,
      name: 'Marcus Brown',
      role: UserRole.DRIVER,
    },
  });
  console.log('Driver user:', driverMarcus.phone);

  // Driver — Devon Reid
  const devonPassword = await bcrypt.hash('Driver@1234', 12);
  const driverDevon = await prisma.user.upsert({
    where: { phone: '+18765550011' },
    update: {},
    create: {
      phone: '+18765550011',
      password: devonPassword,
      name: 'Devon Reid',
      role: UserRole.DRIVER,
    },
  });
  console.log('Driver user:', driverDevon.phone);

  // Passenger user
  const passPassword = await bcrypt.hash('Pass@1234', 12);
  const passenger = await prisma.user.upsert({
    where: { phone: '+18765550020' },
    update: {},
    create: {
      phone: '+18765550020',
      password: passPassword,
      name: 'Jennifer Clarke',
      role: UserRole.PASSENGER,
    },
  });
  await prisma.smartCard.upsert({
    where: { userId: passenger.id },
    update: {},
    create: {
      userId: passenger.id,
      cardNumber: 'JUTC-2024-000001',
      balanceJMD: 500,
    },
  });
  console.log('Passenger user:', passenger.phone, '(card balance: J$500)');

  // Depot — find or create by name (no unique code field)
  let depot = await prisma.depot.findFirst({ where: { name: 'Half Way Tree Depot' } });
  if (!depot) {
    depot = await prisma.depot.create({
      data: {
        name: 'Half Way Tree Depot',
        latitude: 17.9945,
        longitude: -76.7991,
      },
    });
  }
  console.log('Depot:', depot.name);

  // Buses — PA 1001 to PA 1012, all DEPOT status
  for (const b of BUSES) {
    await prisma.bus.upsert({
      where: { plateNumber: b.plateNumber },
      update: {},
      create: {
        plateNumber: b.plateNumber,
        capacity: b.capacity,
        depotId: depot.id,
        status: BusStatus.DEPOT,
        odometerKm: Math.round(Math.random() * 80000),
        lastServiceKm: Math.round(Math.random() * 70000),
        year: 2020,
        make: 'Volvo',
        model: 'B7R',
        hasGPS: true,
        hasValidator: true,
      },
    });
  }
  console.log(`${BUSES.length} buses seeded (PA 1001 - PA 1012)`);

  // Routes with stops
  for (const routeDef of ROUTES) {
    const route = await prisma.route.upsert({
      where: { code: routeDef.code },
      update: { name: routeDef.name, color: routeDef.color, isActive: true },
      create: { code: routeDef.code, name: routeDef.name, color: routeDef.color, isActive: true },
    });

    for (let i = 0; i < routeDef.stops.length; i++) {
      const stopDef = routeDef.stops[i];
      const stopCode = `STOP-${routeDef.code}-${i + 1}`;

      const stop = await prisma.stop.upsert({
        where: { code: stopCode },
        update: { name: stopDef.name, latitude: stopDef.latitude, longitude: stopDef.longitude },
        create: {
          code: stopCode,
          name: stopDef.name,
          latitude: stopDef.latitude,
          longitude: stopDef.longitude,
        },
      });

      const existingRouteStop = await prisma.routeStop.findFirst({
        where: { routeId: route.id, stopId: stop.id },
      });
      if (!existingRouteStop) {
        await prisma.routeStop.create({
          data: { routeId: route.id, stopId: stop.id, sequence: i + 1 },
        });
      }
    }

    console.log(`Route ${route.code} (${route.name}) — ${routeDef.stops.length} stops`);
  }

  // Fare rules
  await prisma.fareRule.upsert({
    where: { id: 'default-standard' },
    update: {},
    create: { id: 'default-standard', fareType: 'STANDARD', baseAmountJMD: 100 },
  });
  await prisma.fareRule.upsert({
    where: { id: 'default-student' },
    update: {},
    create: { id: 'default-student', fareType: 'STUDENT', baseAmountJMD: 60 },
  });
  console.log('Fare rules seeded');

  // Sample notification — idempotent guard
  const existingNotification = await prisma.notification.findFirst({
    where: { title: 'Welcome to JUTC Digital' },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        type: 'SERVICE_ALERT',
        severity: 'INFO',
        title: 'Welcome to JUTC Digital',
        body: 'The JUTC Digital Transit system is now live. Tap your smart card or scan QR codes to pay fares.',
      },
    });
  }
  console.log('Sample notification ensured');

  console.log('\nDatabase seeded successfully!\n');
  console.log('Test credentials:');
  console.log('  Admin:     +18765550001 / Admin@1234');
  console.log('  Executive: +18765550002 / Exec@1234');
  console.log('  Driver 1:  +18765550010 / Driver@1234  (Marcus Brown)');
  console.log('  Driver 2:  +18765550011 / Driver@1234  (Devon Reid)');
  console.log('  Passenger: +18765550020 / Pass@1234');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
