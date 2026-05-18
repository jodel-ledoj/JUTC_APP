import { Router } from 'express';
import authRoutes from './auth.routes';
import smartcardRoutes from './smartcard.routes';
import gpsRoutes from './gps.routes';
import tripRoutes from './trip.routes';
import notificationRoutes from './notification.routes';
import incidentRoutes from './incident.routes';
import adminRoutes from './admin.routes';
import routeRoutes from './route.routes';
import busRoutes from './bus.routes';
import healthRoutes from './health.routes';
import occupancyRoutes from './occupancy.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/smartcard', smartcardRoutes);
router.use('/gps', gpsRoutes);
router.use('/trips', tripRoutes);
router.use('/notifications', notificationRoutes);
router.use('/incidents', incidentRoutes);
router.use('/admin', adminRoutes);
router.use('/routes', routeRoutes);
router.use('/buses', busRoutes);
router.use('/occupancy', occupancyRoutes);

// ---------------------------------------------------------------------------
// GET /demo/routes
// Static fallback route list — matches jutcRoutes.ts exactly.
// Useful when the DB has no routes seeded yet (e.g. first boot, CI).
// ---------------------------------------------------------------------------

const STATIC_DEMO_ROUTES = [
  { code: '22', name: 'Half Way Tree → Downtown', color: '#2F80ED', keyCoords: [{ lat: 17.9945, lng: -76.7991 }, { lat: 17.9883, lng: -76.7892 }, { lat: 17.9935, lng: -76.7835 }, { lat: 17.9992, lng: -76.7934 }, { lat: 17.9981, lng: -76.7942 }] },
  { code: '45', name: 'Papine → Downtown',          color: '#9B51E0', keyCoords: [{ lat: 17.9848, lng: -76.7380 }, { lat: 17.9897, lng: -76.7512 }, { lat: 17.9984, lng: -76.7435 }, { lat: 17.9945, lng: -76.7991 }, { lat: 17.9977, lng: -76.7943 }] },
  { code: '21', name: 'Matilda Corner → Downtown',  color: '#27AE60', keyCoords: [{ lat: 18.0310, lng: -76.8170 }, { lat: 18.0098, lng: -76.7994 }, { lat: 17.9945, lng: -76.7991 }, { lat: 17.9883, lng: -76.7892 }, { lat: 17.9977, lng: -76.7943 }] },
  { code: '23', name: 'Barbican → Downtown',         color: '#F2994A', keyCoords: [{ lat: 17.9992, lng: -76.7730 }, { lat: 17.9972, lng: -76.7791 }, { lat: 17.9945, lng: -76.7991 }, { lat: 17.9883, lng: -76.7892 }, { lat: 17.9977, lng: -76.7943 }] },
  { code: '35', name: 'Portmore → Downtown',         color: '#EB5757', keyCoords: [{ lat: 17.9538, lng: -76.8870 }, { lat: 17.9578, lng: -76.8950 }, { lat: 17.9700, lng: -76.8700 }, { lat: 17.9850, lng: -76.8100 }, { lat: 17.9977, lng: -76.7943 }] },
  { code: '36', name: 'Spanish Town → Downtown',     color: '#F7C137', keyCoords: [{ lat: 17.9910, lng: -76.9551 }, { lat: 17.9876, lng: -76.8945 }, { lat: 17.9800, lng: -76.8500 }, { lat: 17.9538, lng: -76.8870 }, { lat: 17.9977, lng: -76.7943 }] },
  { code: '73', name: 'Waterford → Half Way Tree',   color: '#56CCF2', keyCoords: [{ lat: 17.9604, lng: -76.8810 }, { lat: 17.9580, lng: -76.8740 }, { lat: 17.9699, lng: -76.8592 }, { lat: 17.9700, lng: -76.8700 }, { lat: 17.9945, lng: -76.7991 }] },
  { code: '10', name: 'Downtown → Harbour View',     color: '#219653', keyCoords: [{ lat: 17.9977, lng: -76.7943 }, { lat: 17.9752, lng: -76.7598 }, { lat: 17.9655, lng: -76.7238 }, { lat: 17.9438, lng: -76.6835 }] },
  { code: '24', name: 'Duhaney Park → Downtown',     color: '#BB6BD9', keyCoords: [{ lat: 17.9805, lng: -76.7798 }, { lat: 17.9855, lng: -76.8042 }, { lat: 17.9883, lng: -76.7892 }, { lat: 17.9977, lng: -76.7943 }] },
  { code: '20', name: 'Stony Hill → Downtown',       color: '#6FCF97', keyCoords: [{ lat: 18.0685, lng: -76.7850 }, { lat: 18.0098, lng: -76.7994 }, { lat: 17.9945, lng: -76.7991 }, { lat: 17.9977, lng: -76.7943 }] },
];

router.get('/demo/routes', (_req, res) => {
  res.json({ success: true, data: STATIC_DEMO_ROUTES });
});

export default router;
