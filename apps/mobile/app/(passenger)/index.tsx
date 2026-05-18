import React, {
  useState, useEffect, useRef, useCallback, useMemo, Component,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Bell, Search, Navigation, X, CreditCard } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { useOccupancy } from '../../hooks/useOccupancy';
import { Colors } from '../../constants/colors';
import { formatJMDShort } from '../../constants/currency';
import { TransitIntelStrip } from '../../components/passenger/TransitIntelStrip';
import { BusMarker } from '../../components/passenger/BusMarker';
import { SearchPanel } from '../../components/passenger/SearchPanel';
import { NearbyPanel } from '../../components/passenger/NearbyPanel';
import { BusDetailSheet } from '../../components/passenger/BusDetailSheet';
import {
  searchRoutes,
  type RouteSearchResult,
  type JutcRoute,
} from '../../lib/jutcRoutes';
import { getSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { JUTC_HUBS } from '../../lib/hubData';
import { getDirectionsPolyline, type LatLng } from '../../lib/directions';

// ── Map setup (dev-build safe) ───────────────────────────────────────────────
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (_) {}

class MapErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  componentDidCatch() { this.setState({ failed: true }); }
  render() {
    if (this.state.failed || !MapView) {
      return (
        <View style={styles.mapFallback}>
          <Navigation size={28} color={Colors.textMuted} strokeWidth={1.5} />
          <Text style={styles.mapFallbackTitle}>Map unavailable</Text>
          <Text style={styles.mapFallbackSub}>Requires development build</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Constants ────────────────────────────────────────────────────────────────
const { height: SCREEN_H } = Dimensions.get('window');
const JAMAICA_REGION = {
  latitude: 17.9714,
  longitude: -76.7936,
  latitudeDelta: 2.0,
  longitudeDelta: 2.0,
};

// Sheet snap points — search bar always accessible at peek
const SNAP_PEEK     = SCREEN_H * 0.22;
const SNAP_DEFAULT  = SCREEN_H * 0.36;
const SNAP_EXPANDED = SCREEN_H * 0.68;
const SNAPS = [SNAP_PEEK, SNAP_DEFAULT, SNAP_EXPANDED] as const;

// Demo route data for simulated buses
const DEMO_ROUTES = [
  { id: 'sim-1', routeCode: '22', startLat: 17.9953, startLng: -76.7970, endLat: 17.9977, endLng: -76.7943, progress: 0.1 },
  { id: 'sim-2', routeCode: '45', startLat: 17.9848, startLng: -76.7380, endLat: 17.9953, endLng: -76.7970, progress: 0.3 },
  { id: 'sim-3', routeCode: '35', startLat: 17.9538, startLng: -76.8870, endLat: 17.9977, endLng: -76.7943, progress: 0.5 },
  { id: 'sim-4', routeCode: '75', startLat: 17.9699, startLng: -76.8592, endLat: 17.9953, endLng: -76.7970, progress: 0.7 },
] as const;

type SimBus = {
  id: string;
  routeCode: string;
  latitude: number;
  longitude: number;
  progress: number;
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function PassengerHome() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const mapRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<JutcRoute | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busPositions, setBusPositions] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [roadPolyline, setRoadPolyline] = useState<LatLng[]>([]);

  // Simulated buses for demo (shown only when no real buses exist)
  const [simBuses, setSimBuses] = useState<SimBus[]>([]);
  const simIntervalRef = useRef<any>(null);

  const sheetAnim = useRef(new Animated.Value(SNAP_DEFAULT)).current;
  const sheetOffset = useRef(SNAP_DEFAULT);
  const [snapIndex, setSnapIndex] = useState(1);

  useEffect(() => {
    const id = sheetAnim.addListener(({ value }) => { sheetOffset.current = value; });
    return () => sheetAnim.removeListener(id);
  }, [sheetAnim]);

  // ── PanResponder ──────────────────────────────────────────────────────────
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
    onPanResponderGrant: () => { sheetAnim.stopAnimation(); },
    onPanResponderMove: (_, g) => {
      const next = Math.max(SNAP_PEEK, Math.min(SNAP_EXPANDED, sheetOffset.current - g.dy));
      sheetAnim.setValue(next);
    },
    onPanResponderRelease: (_, g) => {
      const cur = sheetOffset.current;
      let target = SNAPS[0];
      let minDist = Infinity;
      for (const snap of SNAPS) {
        const dist = Math.abs(cur - snap) - g.vy * 200;
        if (dist < minDist) { minDist = dist; target = snap; }
      }
      const idx = SNAPS.indexOf(target);
      setSnapIndex(idx);
      setSearchActive(idx === 2);
      Animated.spring(sheetAnim, { toValue: target, useNativeDriver: false, tension: 80, friction: 12 }).start();
    },
  }), [sheetAnim]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: cardData } = useQuery({
    queryKey: ['smartcard', 'balance'],
    queryFn: async () => (await api.get('/smartcard/balance')).data.data,
    staleTime: 60_000,
  });
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.data,
    staleTime: 30_000,
  });
  const { data: nearbyTrips } = useQuery({
    queryKey: ['trips', 'active'],
    queryFn: async () => (await api.get('/trips/active')).data.data,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const { data: busPos } = useQuery({
    queryKey: ['gps', 'positions'],
    queryFn: async () => (await api.get('/gps/positions')).data.data,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const occupancyMap = useOccupancy();

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasAlerts = useMemo(
    () => notifications?.some((n: any) => n.severity === 'CRITICAL' || n.severity === 'WARNING') ?? false,
    [notifications],
  );
  const balance = cardData?.balanceJMD ?? 0;
  const firstName = user?.name?.split(' ')[0] ?? 'Commuter';
  const searchResults = useMemo(
    () => (searchQuery.length >= 2 ? searchRoutes(searchQuery) : []),
    [searchQuery],
  );

  // ── Road-following polyline ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedRoute || selectedRoute.keyCoords.length < 2) {
      setRoadPolyline([]);
      return;
    }
    const coords = selectedRoute.keyCoords;
    const origin = { latitude: coords[0].lat, longitude: coords[0].lng };
    const destination = { latitude: coords[coords.length - 1].lat, longitude: coords[coords.length - 1].lng };
    const waypoints = coords.slice(1, -1).map((c) => ({ latitude: c.lat, longitude: c.lng }));
    getDirectionsPolyline(origin, destination, waypoints)
      .then(setRoadPolyline)
      .catch(() => {
        // Fallback to straight keyCoords if Directions API unavailable
        setRoadPolyline(coords.map((c) => ({ latitude: c.lat, longitude: c.lng })));
      });
  }, [selectedRoute]);

  // ── Location ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      setTimeout(() => {
        mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 1400);
      }, 600);
    })();
  }, []);

  // ── Real-time bus positions ───────────────────────────────────────────────
  useEffect(() => { if (busPos) setBusPositions(busPos); }, [busPos]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const socket = await getSocket();
      socketRef.current = socket;
      socket.on(SOCKET_EVENTS.GPS_UPDATE, ({ position }: any) => {
        if (!mounted) return;
        setBusPositions((prev) => {
          const idx = prev.findIndex((p) => p.busId === position.busId);
          if (idx >= 0) { const next = [...prev]; next[idx] = position; return next; }
          return [...prev, position];
        });
      });
    })();
    return () => { mounted = false; socketRef.current?.off(SOCKET_EVENTS.GPS_UPDATE); };
  }, []);

  // ── Simulated buses for demo ──────────────────────────────────────────────
  useEffect(() => {
    setSimBuses(
      DEMO_ROUTES.map((r) => ({
        id: r.id,
        routeCode: r.routeCode,
        latitude: r.startLat + (r.endLat - r.startLat) * r.progress,
        longitude: r.startLng + (r.endLng - r.startLng) * r.progress,
        progress: r.progress,
      })),
    );

    simIntervalRef.current = setInterval(() => {
      setSimBuses((prev) =>
        prev.map((bus, i) => {
          const route = DEMO_ROUTES[i];
          const newProgress = (bus.progress + 0.002) % 1;
          return {
            ...bus,
            progress: newProgress,
            latitude: route.startLat + (route.endLat - route.startLat) * newProgress,
            longitude: route.startLng + (route.endLng - route.startLng) * newProgress,
          };
        }),
      );
    }, 1500);

    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, []);

  // ── Sheet helpers ─────────────────────────────────────────────────────────
  const expandSheet = useCallback(() => {
    setSearchActive(true);
    setSnapIndex(2);
    Animated.spring(sheetAnim, { toValue: SNAP_EXPANDED, useNativeDriver: false, tension: 80, friction: 12 }).start();
  }, [sheetAnim]);

  const collapseSheet = useCallback(() => {
    setSearchActive(false);
    setSearchQuery('');
    setSnapIndex(1);
    Animated.spring(sheetAnim, { toValue: SNAP_DEFAULT, useNativeDriver: false, tension: 80, friction: 12 }).start();
  }, [sheetAnim]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBusTap = useCallback((pos: any) => {
    mapRef.current?.animateToRegion(
      { latitude: pos.latitude, longitude: pos.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600,
    );
    setSelectedBus(pos);
  }, []);

  const handleRouteSelect = useCallback((result: RouteSearchResult) => {
    const route = result.route;
    setSelectedRoute(route);
    collapseSheet();
    if (route.keyCoords.length > 0 && mapRef.current) {
      const coords = route.keyCoords.map((c) => ({ latitude: c.lat, longitude: c.lng }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 60, bottom: SNAP_DEFAULT + 40, left: 60 },
        animated: true,
      });
    }
  }, [collapseSheet]);

  const handleClearRoute = useCallback(() => { setSelectedRoute(null); }, []);

  const handleCenterUser = useCallback(() => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 600);
  }, [userLocation]);

  return (
    <View style={styles.container}>

      {/* ── Map ── */}
      <MapErrorBoundary>
        {MapView && (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={JAMAICA_REGION}
            mapType="standard"
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            pitchEnabled={false}
            rotateEnabled={false}
            loadingEnabled
            loadingBackgroundColor={Colors.background}
          >
            {/* Real bus markers */}
            {busPositions.map((pos) => (
              <Marker
                key={pos.busId}
                coordinate={{ latitude: pos.latitude, longitude: pos.longitude }}
                onPress={() => handleBusTap(pos)}
                tracksViewChanges={false}
              >
                <BusMarker routeCode={pos.routeCode} occupancyLevel={occupancyMap[pos.busId]?.level ?? null} />
              </Marker>
            ))}

            {/* Hub markers */}
            {JUTC_HUBS.map((hub) => (
              <Marker
                key={hub.id}
                coordinate={{ latitude: hub.latitude, longitude: hub.longitude }}
                tracksViewChanges={false}
              >
                <View style={styles.hubMarker}>
                  <Text style={styles.hubMarkerText}>{hub.shortName}</Text>
                </View>
              </Marker>
            ))}

            {/* Simulated buses — only shown when no real buses to avoid clutter */}
            {busPositions.length === 0 && simBuses.map((bus) => (
              <Marker
                key={bus.id}
                coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
                tracksViewChanges={true}
                onPress={() => handleBusTap({ ...bus, busId: bus.id })}
              >
                <BusMarker routeCode={bus.routeCode} occupancyLevel="LOW" />
              </Marker>
            ))}

            {/* Road-following route polyline */}
            {Polyline && roadPolyline.length > 1 && (
              <Polyline
                coordinates={roadPolyline}
                strokeColor={Colors.primary}
                strokeWidth={4}
                lineDashPattern={undefined}
              />
            )}
          </MapView>
        )}
      </MapErrorBoundary>

      {/* ── Minimal top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        {/* Greeting */}
        <View style={styles.greetingGroup}>
          <Text style={styles.jutcTag}>JUTC Digital</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>

        {/* Top actions */}
        <View style={styles.topActions}>
          {/* Compact wallet chip — tertiary access */}
          <TouchableOpacity
            style={styles.walletChip}
            onPress={() => router.push('/(passenger)/smartcard')}
            activeOpacity={0.8}
          >
            <CreditCard size={12} color={Colors.text} strokeWidth={2} />
            <Text style={styles.walletChipText}>{formatJMDShort(balance)}</Text>
          </TouchableOpacity>

          {/* Alerts bell */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(passenger)/notifications')}
            activeOpacity={0.8}
          >
            <Bell size={17} color={Colors.text} strokeWidth={1.8} />
            {hasAlerts && <View style={styles.alertDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Selected route label ── */}
      {selectedRoute && (
        <View style={[styles.routeBanner, { top: insets.top + 74 }]}>
          <View style={styles.routeBannerCode}>
            <Text style={styles.routeBannerCodeText}>{selectedRoute.code}</Text>
          </View>
          <Text style={styles.routeBannerName} numberOfLines={1}>{selectedRoute.name}</Text>
          <TouchableOpacity onPress={handleClearRoute} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color={Colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Map controls ── */}
      {userLocation && (
        <TouchableOpacity
          style={[styles.centerBtn, { bottom: SNAP_DEFAULT + 14 }]}
          onPress={handleCenterUser}
          activeOpacity={0.85}
        >
          <Navigation size={17} color={Colors.text} strokeWidth={1.8} />
        </TouchableOpacity>
      )}

      {/* ── Map dim overlay when bus sheet is open ── */}
      {selectedBus && (
        <View style={styles.mapDimOverlay} pointerEvents="none" />
      )}

      {/* ── Bottom sheet ── */}
      <Animated.View
        style={[styles.sheet, { height: sheetAnim, paddingBottom: insets.bottom + 16 }]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        <View style={styles.sheetHandle} />

        {/* 1. SEARCH — primary interaction */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, searchActive && styles.searchBoxActive]}>
            <Search size={16} color={searchActive ? Colors.text : Colors.textMuted} strokeWidth={1.8} />
            <TextInput
              style={styles.searchInput}
              placeholder="Where do you want to go?"
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={expandSheet}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchActive && (
              <TouchableOpacity onPress={collapseSheet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. TRANSIT INTEL — contextual awareness */}
        {!searchActive && (
          <TransitIntelStrip nearbyTrips={nearbyTrips ?? []} notifications={notifications ?? []} />
        )}

        {/* 3. CONTENT — route discovery or nearby buses */}
        {searchActive
          ? <SearchPanel query={searchQuery} results={searchResults} onSelect={handleRouteSelect} />
          : <NearbyPanel trips={nearbyTrips ?? []} occupancyMap={occupancyMap} />
        }
      </Animated.View>

      {/* ── Bus detail sheet ── */}
      <BusDetailSheet
        visible={!!selectedBus}
        busPosition={selectedBus}
        onClose={() => setSelectedBus(null)}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  mapDimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,31,36,0.2)',
    zIndex: 1,
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapFallbackTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  mapFallbackSub:   { fontSize: 13, color: Colors.textMuted },

  // ── Top bar — slim, transparent-backed ──────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  greetingGroup: { gap: 1 },
  jutcTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  greetingName: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Compact wallet chip — tertiary
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },

  // Icon buttons
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertDot: {
    position: 'absolute',
    top: 8, right: 8,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: Colors.critical,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  // ── Hub markers ───────────────────────────────────────────────────────────
  hubMarker: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: Colors.black,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  hubMarkerText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 0.3,
  },

  // ── Route banner ─────────────────────────────────────────────────────────
  routeBanner: {
    position: 'absolute',
    left: 18, right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeBannerCode: {
    backgroundColor: Colors.black,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  routeBannerCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  routeBannerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },

  // ── Map controls ─────────────────────────────────────────────────────────
  centerBtn: {
    position: 'absolute',
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // ── Bottom sheet ─────────────────────────────────────────────────────────
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },

  // Search
  searchRow: { marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchBoxActive: {
    borderColor: Colors.black,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
    fontWeight: '400',
  },
});
