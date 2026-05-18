
export interface JutcStop {
  name: string;
  lat?: number;
  lng?: number;
}

export interface KeyCoord {
  lat: number;
  lng: number;
}

export interface JutcRoute {
  code: string;
  name: string;
  stops: string[];
  landmarks: string[];
  fareEstimateJMD: number;
  durationMinutes: number;
  frequencyMinutes: number;
  walkingMinutesToStop: number;
  keyStopsAbbrev: string;
  keyCoords: KeyCoord[];
  operatingHours: { start: string; end: string; peakFrequencyMinutes?: number };
}

// Static JUTC route data — sourced from official JUTC schedules
// This powers offline search and trip planning without live scraping
export const JUTC_ROUTES: JutcRoute[] = [
  {
    code: '22',
    name: 'Half Way Tree \u2192 Downtown',
    stops: ['Half Way Tree', 'Cross Roads', 'New Kingston', 'Downtown Kingston', 'Parade'],
    landmarks: ['Half Way Tree', 'Cross Roads', 'New Kingston', 'Downtown', 'Parade'],
    fareEstimateJMD: 100,
    durationMinutes: 25,
    frequencyMinutes: 15,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'HWT \u2192 Cross Roads \u2192 Downtown',
    keyCoords: [
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9905, lng: -76.7982 }, // Cross Roads
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '45',
    name: 'Papine \u2192 Downtown',
    stops: ['Papine', 'Mona', 'University Hospital', 'Half Way Tree', 'Cross Roads', 'Downtown'],
    landmarks: ['Papine', 'UWI Mona', 'Half Way Tree', 'Downtown Kingston'],
    fareEstimateJMD: 100,
    durationMinutes: 40,
    frequencyMinutes: 20,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Papine \u2192 HWT \u2192 Downtown',
    keyCoords: [
      { lat: 17.9848, lng: -76.7380 }, // Papine
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '21',
    name: 'Matilda\'s Corner \u2192 Downtown',
    stops: ['Matilda\'s Corner', 'Constant Spring', 'Half Way Tree', 'Cross Roads', 'Downtown'],
    landmarks: ['Constant Spring', 'Half Way Tree', 'Downtown'],
    fareEstimateJMD: 100,
    durationMinutes: 35,
    frequencyMinutes: 20,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Matilda\'s \u2192 HWT \u2192 Downtown',
    keyCoords: [
      { lat: 18.0310, lng: -76.8170 }, // Matilda's Corner
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '23',
    name: 'Barbican \u2192 Downtown',
    stops: ['Barbican', 'Liguanea', 'Half Way Tree', 'Cross Roads', 'Downtown'],
    landmarks: ['Barbican', 'Liguanea', 'Half Way Tree', 'Downtown'],
    fareEstimateJMD: 100,
    durationMinutes: 30,
    frequencyMinutes: 18,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Barbican \u2192 HWT \u2192 Downtown',
    keyCoords: [
      { lat: 17.9992, lng: -76.7730 }, // Barbican
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '35',
    name: 'Portmore \u2192 Downtown',
    stops: ['Portmore', 'Gregory Park', 'Caymanas', 'Spanish Town Road', 'Downtown'],
    landmarks: ['Portmore', 'Spanish Town Road', 'Downtown Kingston'],
    fareEstimateJMD: 120,
    durationMinutes: 45,
    frequencyMinutes: 12,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Portmore \u2192 Gregory Pk \u2192 Downtown',
    keyCoords: [
      { lat: 17.9538, lng: -76.8870 }, // Portmore
      { lat: 17.9578, lng: -76.8950 }, // Gregory Park
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:30', end: '21:00' },
  },
  {
    code: '36',
    name: 'Spanish Town \u2192 Downtown',
    stops: ['Spanish Town', 'Caymanas', 'Old Harbour Road', 'Spanish Town Road', 'Downtown'],
    landmarks: ['Spanish Town', 'Downtown Kingston'],
    fareEstimateJMD: 150,
    durationMinutes: 60,
    frequencyMinutes: 25,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Sp. Town \u2192 Caymanas \u2192 Downtown',
    keyCoords: [
      { lat: 17.9910, lng: -76.9551 }, // Spanish Town
      { lat: 17.9876, lng: -76.8945 }, // Caymanas
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:30', end: '21:00' },
  },
  {
    code: '73',
    name: 'Waterford \u2192 Half Way Tree',
    stops: ['Waterford', 'Portmore Mall', 'Ferry', 'Half Way Tree'],
    landmarks: ['Waterford', 'Portmore', 'Half Way Tree'],
    fareEstimateJMD: 120,
    durationMinutes: 50,
    frequencyMinutes: 25,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Waterford \u2192 Ferry \u2192 HWT',
    keyCoords: [
      { lat: 17.9604, lng: -76.8810 }, // Waterford
      { lat: 17.9699, lng: -76.8592 }, // Ferry
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '10',
    name: 'Downtown \u2192 Harbour View',
    stops: ['Downtown', 'Harbour View', 'Bull Bay'],
    landmarks: ['Downtown Kingston', 'Harbour View'],
    fareEstimateJMD: 100,
    durationMinutes: 30,
    frequencyMinutes: 20,
    walkingMinutesToStop: 3,
    keyStopsAbbrev: 'Downtown \u2192 Harbour View \u2192 Bull Bay',
    keyCoords: [
      { lat: 17.9977, lng: -76.7943 }, // Downtown
      { lat: 17.9655, lng: -76.7238 }, // Harbour View
      { lat: 17.9438, lng: -76.6835 }, // Bull Bay
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '24',
    name: 'Duhaney Park \u2192 Downtown',
    stops: ['Duhaney Park', 'Hagley Park', 'Cross Roads', 'Downtown'],
    landmarks: ['Duhaney Park', 'Hagley Park', 'Downtown'],
    fareEstimateJMD: 100,
    durationMinutes: 30,
    frequencyMinutes: 18,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Duhaney \u2192 Hagley Pk \u2192 Downtown',
    keyCoords: [
      { lat: 17.9805, lng: -76.7798 }, // Duhaney Park
      { lat: 17.9855, lng: -76.8042 }, // Hagley Park
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '20',
    name: 'Stony Hill \u2192 Downtown',
    stops: ['Stony Hill', 'Constant Spring', 'Half Way Tree', 'Downtown'],
    landmarks: ['Stony Hill', 'Constant Spring', 'Half Way Tree', 'Downtown'],
    fareEstimateJMD: 120,
    durationMinutes: 45,
    frequencyMinutes: 30,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Stony Hill \u2192 HWT \u2192 Downtown',
    keyCoords: [
      { lat: 18.0685, lng: -76.7850 }, // Stony Hill
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  // --- Additional island-wide routes ---
  {
    code: '75',
    name: 'Papine \u2192 Ferry',
    stops: ['Papine', 'Half Way Tree', 'Cross Roads', 'Ferry'],
    landmarks: ['Papine', 'Half Way Tree', 'Ferry'],
    fareEstimateJMD: 120,
    durationMinutes: 55,
    frequencyMinutes: 25,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Papine \u2192 HWT \u2192 Ferry',
    keyCoords: [
      { lat: 17.9848, lng: -76.7380 }, // Papine
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9699, lng: -76.8592 }, // Ferry
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '1',
    name: 'Downtown \u2192 Portmore',
    stops: ['Downtown', 'Ferry', 'Bridgeport', 'Portmore'],
    landmarks: ['Downtown Kingston', 'Ferry', 'Portmore'],
    fareEstimateJMD: 120,
    durationMinutes: 50,
    frequencyMinutes: 15,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Downtown \u2192 Ferry \u2192 Portmore',
    keyCoords: [
      { lat: 17.9977, lng: -76.7943 }, // Downtown
      { lat: 17.9699, lng: -76.8592 }, // Ferry
      { lat: 17.9538, lng: -76.8870 }, // Portmore
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '38',
    name: 'Duhaney Park \u2192 Portmore',
    stops: ['Duhaney Park', 'Downtown', 'Ferry', 'Portmore'],
    landmarks: ['Duhaney Park', 'Downtown', 'Portmore'],
    fareEstimateJMD: 150,
    durationMinutes: 60,
    frequencyMinutes: 30,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Duhaney \u2192 Downtown \u2192 Portmore',
    keyCoords: [
      { lat: 17.9805, lng: -76.7798 }, // Duhaney Park
      { lat: 17.9977, lng: -76.7943 }, // Downtown
      { lat: 17.9538, lng: -76.8870 }, // Portmore
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '30',
    name: 'Constant Spring \u2192 Downtown',
    stops: ['Constant Spring', 'Half Way Tree', 'Cross Roads', 'Downtown'],
    landmarks: ['Constant Spring', 'Half Way Tree', 'Downtown'],
    fareEstimateJMD: 100,
    durationMinutes: 40,
    frequencyMinutes: 20,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Constant Spring \u2192 HWT \u2192 Downtown',
    keyCoords: [
      { lat: 18.0420, lng: -76.8042 }, // Constant Spring
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '32',
    name: 'Manor Park \u2192 Downtown',
    stops: ['Manor Park', 'Half Way Tree', 'Cross Roads', 'Downtown'],
    landmarks: ['Manor Park', 'Half Way Tree', 'Downtown'],
    fareEstimateJMD: 100,
    durationMinutes: 35,
    frequencyMinutes: 20,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Manor Park \u2192 HWT \u2192 Downtown',
    keyCoords: [
      { lat: 18.0225, lng: -76.7965 }, // Manor Park
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '42',
    name: 'Meadowbrook \u2192 Downtown',
    stops: ['Meadowbrook', 'Cross Roads', 'Downtown'],
    landmarks: ['Meadowbrook', 'Cross Roads', 'Downtown'],
    fareEstimateJMD: 100,
    durationMinutes: 30,
    frequencyMinutes: 20,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Meadowbrook \u2192 Cross Roads \u2192 Downtown',
    keyCoords: [
      { lat: 17.9820, lng: -76.7690 }, // Meadowbrook
      { lat: 17.9905, lng: -76.7982 }, // Cross Roads
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '60',
    name: 'Spanish Town \u2192 Portmore',
    stops: ['Spanish Town', 'Waterford', 'Portmore'],
    landmarks: ['Spanish Town', 'Waterford', 'Portmore'],
    fareEstimateJMD: 100,
    durationMinutes: 30,
    frequencyMinutes: 20,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'Sp. Town \u2192 Waterford \u2192 Portmore',
    keyCoords: [
      { lat: 17.9910, lng: -76.9551 }, // Spanish Town
      { lat: 17.9604, lng: -76.8810 }, // Waterford
      { lat: 17.9538, lng: -76.8870 }, // Portmore
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '55',
    name: 'August Town \u2192 Downtown',
    stops: ['August Town', 'UWI', 'Papine', 'Downtown'],
    landmarks: ['August Town', 'UWI Mona', 'Downtown'],
    fareEstimateJMD: 100,
    durationMinutes: 35,
    frequencyMinutes: 25,
    walkingMinutesToStop: 4,
    keyStopsAbbrev: 'August Town \u2192 UWI \u2192 Downtown',
    keyCoords: [
      { lat: 18.0074, lng: -76.7528 }, // August Town
      { lat: 17.9908, lng: -76.7465 }, // UWI
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '11',
    name: 'Downtown \u2192 Rockfort',
    stops: ['Downtown', 'Rockfort'],
    landmarks: ['Downtown Kingston', 'Rockfort'],
    fareEstimateJMD: 100,
    durationMinutes: 25,
    frequencyMinutes: 20,
    walkingMinutesToStop: 3,
    keyStopsAbbrev: 'Downtown \u2192 Rockfort',
    keyCoords: [
      { lat: 17.9977, lng: -76.7943 }, // Downtown
      { lat: 17.9776, lng: -76.7510 }, // Rockfort
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '28',
    name: 'Barbican \u2192 Half Way Tree',
    stops: ['Barbican', 'Liguanea', 'Half Way Tree'],
    landmarks: ['Barbican', 'Liguanea', 'Half Way Tree'],
    fareEstimateJMD: 80,
    durationMinutes: 20,
    frequencyMinutes: 15,
    walkingMinutesToStop: 3,
    keyStopsAbbrev: 'Barbican \u2192 Liguanea \u2192 HWT',
    keyCoords: [
      { lat: 17.9992, lng: -76.7730 }, // Barbican
      { lat: 17.9970, lng: -76.7820 }, // Liguanea
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '77',
    name: 'Waterford \u2192 Downtown',
    stops: ['Waterford', 'Ferry', 'Downtown'],
    landmarks: ['Waterford', 'Ferry', 'Downtown'],
    fareEstimateJMD: 130,
    durationMinutes: 55,
    frequencyMinutes: 25,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Waterford \u2192 Ferry \u2192 Downtown',
    keyCoords: [
      { lat: 17.9604, lng: -76.8810 }, // Waterford
      { lat: 17.9699, lng: -76.8592 }, // Ferry
      { lat: 17.9977, lng: -76.7943 }, // Downtown
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
  {
    code: '50',
    name: 'Harbour View \u2192 Half Way Tree',
    stops: ['Harbour View', 'Downtown', 'Half Way Tree'],
    landmarks: ['Harbour View', 'Downtown Kingston', 'Half Way Tree'],
    fareEstimateJMD: 120,
    durationMinutes: 45,
    frequencyMinutes: 30,
    walkingMinutesToStop: 5,
    keyStopsAbbrev: 'Harbour View \u2192 Downtown \u2192 HWT',
    keyCoords: [
      { lat: 17.9655, lng: -76.7238 }, // Harbour View
      { lat: 17.9977, lng: -76.7943 }, // Downtown
      { lat: 17.9953, lng: -76.7970 }, // Half Way Tree
    ],
    operatingHours: { start: '05:00', end: '22:00' },
  },
];

export interface RouteSearchResult {
  route: JutcRoute;
  matchType: 'direct' | 'transfer';
  transferRoute?: JutcRoute;
  fareEstimateJMD: number;
  durationMinutes: number;
  confidence: number;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getTimeAwareRoutes(routes: JutcRoute[] = JUTC_ROUTES): JutcRoute[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return routes.filter((route) => {
    const start = parseTimeToMinutes(route.operatingHours.start);
    const end = parseTimeToMinutes(route.operatingHours.end);
    return currentMinutes >= start && currentMinutes <= end;
  });
}

export function getNextDepartures(
  routeCode: string,
  fromNow: Date = new Date(),
): Array<{ time: string; minutesAway: number }> {
  const route = JUTC_ROUTES.find((r) => r.code === routeCode);
  if (!route) return [];

  const currentMinutes = fromNow.getHours() * 60 + fromNow.getMinutes();
  const startMinutes = parseTimeToMinutes(route.operatingHours.start);
  const endMinutes = parseTimeToMinutes(route.operatingHours.end);
  const freq = route.frequencyMinutes;

  const departures: Array<{ time: string; minutesAway: number }> = [];

  // Walk forward from service start, find next departures after current time
  let candidate = startMinutes;
  while (candidate <= endMinutes && departures.length < 3) {
    const minutesAway = candidate - currentMinutes;
    if (minutesAway >= 0) {
      departures.push({ time: formatMinutesToTime(candidate), minutesAway });
    }
    candidate += freq;
  }

  return departures;
}

export function searchRoutes(query: string, routes: JutcRoute[] = JUTC_ROUTES): RouteSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: RouteSearchResult[] = [];

  for (const route of routes) {
    const allText = [
      route.code,
      route.name,
      ...route.stops,
      ...route.landmarks,
    ].join(' ').toLowerCase();

    if (allText.includes(q)) {
      results.push({
        route,
        matchType: 'direct',
        fareEstimateJMD: route.fareEstimateJMD,
        durationMinutes: route.durationMinutes,
        confidence: route.code.toLowerCase() === q ? 1.0 : 0.8,
      });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, 5);
}

export function findRoutesForTrip(
  origin: string,
  destination: string,
  routes: JutcRoute[] = JUTC_ROUTES,
): RouteSearchResult[] {
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();
  const results: RouteSearchResult[] = [];

  // Direct routes
  for (const route of routes) {
    const stops = route.stops.map((s) => s.toLowerCase());
    const hasOrigin = stops.some((s) => s.includes(o));
    const hasDest = stops.some((s) => s.includes(d));

    if (hasOrigin && hasDest) {
      const originIdx = stops.findIndex((s) => s.includes(o));
      const destIdx = stops.findIndex((s) => s.includes(d));
      if (originIdx < destIdx) {
        results.push({
          route,
          matchType: 'direct',
          fareEstimateJMD: route.fareEstimateJMD,
          durationMinutes: route.durationMinutes,
          confidence: 1.0,
        });
      }
    }
  }

  // Transfer via Downtown / Half Way Tree
  if (results.length === 0) {
    const hubs = ['downtown', 'half way tree', 'cross roads'];
    for (const hub of hubs) {
      const leg1 = routes.find((r) => {
        const stops = r.stops.map((s) => s.toLowerCase());
        return stops.some((s) => s.includes(o)) && stops.some((s) => s.includes(hub));
      });
      const leg2 = routes.find((r) => {
        const stops = r.stops.map((s) => s.toLowerCase());
        return stops.some((s) => s.includes(hub)) && stops.some((s) => s.includes(d));
      });

      if (leg1 && leg2 && leg1 !== leg2) {
        results.push({
          route: leg1,
          matchType: 'transfer',
          transferRoute: leg2,
          fareEstimateJMD: leg1.fareEstimateJMD + leg2.fareEstimateJMD,
          durationMinutes: leg1.durationMinutes + leg2.durationMinutes + 10,
          confidence: 0.7,
        });
        break;
      }
    }
  }

  return results;
}

export const POPULAR_DESTINATIONS = [
  { name: 'Downtown Kingston', icon: '\u{1F3DB}\uFE0F' },
  { name: 'Half Way Tree', icon: '\u{1F333}' },
  { name: 'Papine', icon: '\u{1F393}' },
  { name: 'Portmore', icon: '\u{1F309}' },
  { name: 'New Kingston', icon: '\u{1F3E2}' },
  { name: 'Spanish Town', icon: '\u{1F3D9}\uFE0F' },
];
