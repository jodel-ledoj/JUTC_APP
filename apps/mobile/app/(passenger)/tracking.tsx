import React, { useState, useEffect, useRef, Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Bus } from 'lucide-react-native';

// react-native-maps requires a development build for full Codegen support
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (_) {}

class MapErrorBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  componentDidCatch() { this.setState({ failed: true }); }
  render() {
    if (this.state.failed || !MapView) {
      return (
        <View style={styles.mapFallback}>
          <Bus size={24} color={Colors.textMuted} strokeWidth={1.5} />
          <Text style={styles.mapFallbackText}>Map requires a development build</Text>
          <Text style={styles.mapFallbackSub}>Live bus positions update via the panel below</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket, joinRouteRoom, leaveRouteRoom } from '../../lib/socket';
import { Colors } from '../../constants/colors';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { useOccupancy } from '../../hooks/useOccupancy';
import { OccupancyPill } from '../../components/OccupancyPill';
import { getOccupancyLevel, OCCUPANCY_COLORS, OCCUPANCY_LABELS } from '../../constants/occupancy';

export default function TrackingScreen() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [busPositions, setBusPositions] = useState<any[]>([]);
  const socketRef = useRef<any>(null);
  const occupancyMap = useOccupancy();

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data.data,
  });

  const { data: initialPositions } = useQuery({
    queryKey: ['gps', 'positions', selectedRouteId],
    queryFn: async () =>
      (await api.get('/gps/positions', { params: { routeId: selectedRouteId } })).data.data,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (initialPositions) setBusPositions(initialPositions);
  }, [initialPositions]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const socket = await getSocket();
      socketRef.current = socket;
      if (selectedRouteId) joinRouteRoom(selectedRouteId);

      socket.on(SOCKET_EVENTS.GPS_UPDATE, ({ position }: any) => {
        if (!mounted) return;
        setBusPositions((prev) => {
          const idx = prev.findIndex((p) => p.busId === position.busId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = position;
            return next;
          }
          return [...prev, position];
        });
      });
    })();
    return () => {
      mounted = false;
      if (selectedRouteId) leaveRouteRoom(selectedRouteId);
      socketRef.current?.off(SOCKET_EVENTS.GPS_UPDATE);
    };
  }, [selectedRouteId]);

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapErrorBoundary>
        {MapView && (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 17.9714,
              longitude: -76.7936,
              latitudeDelta: 0.15,
              longitudeDelta: 0.15,
            }}
            mapType="standard"
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {busPositions.map((pos) => (
              <Marker
                key={pos.busId}
                coordinate={{ latitude: pos.latitude, longitude: pos.longitude }}
                title={`Bus ${pos.plateNumber}`}
                description={`Route ${pos.routeCode ?? 'Unknown'} · ${Math.round(pos.speed ?? 0)} km/h`}
              >
                <View style={styles.busMarker}>
                  <Text style={styles.busMarkerText}>
                    {pos.routeCode?.slice(0, 3) ?? 'BUS'}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>
        )}
      </MapErrorBoundary>

      {/* Route filter — floating above map */}
      <View style={styles.filterOverlay}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterPill, !selectedRouteId && styles.filterPillActive]}
            onPress={() => setSelectedRouteId(null)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, !selectedRouteId && styles.filterPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {routes?.map((route: any) => (
            <TouchableOpacity
              key={route.id}
              style={[styles.filterPill, selectedRouteId === route.id && styles.filterPillActive]}
              onPress={() => setSelectedRouteId(route.id === selectedRouteId ? null : route.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedRouteId === route.id && styles.filterPillTextActive,
                ]}
              >
                {route.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom info panel */}
      <View style={styles.infoPanel}>
        <View style={styles.infoPanelHandle} />
        <View style={styles.infoPanelRow}>
          <View>
            <Text style={styles.infoPanelCount}>
              {busPositions.length}{' '}
              <Text style={styles.infoPanelCountSuffix}>
                {busPositions.length === 1 ? 'bus' : 'buses'} active
                {selectedRouteId ? ' on route' : ''}
              </Text>
            </Text>
            <Text style={styles.infoPanelSub}>Tap a marker for occupancy details · 15s updates</Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveChipText}>Live</Text>
          </View>
        </View>

        {/* Occupancy summary row — only shown when data is available */}
        {Object.keys(occupancyMap).length > 0 && (
          <View style={styles.occupancyRow}>
            {busPositions.slice(0, 3).map((pos) => {
              const occ = occupancyMap[pos.busId];
              if (!occ) return null;
              return (
                <View key={pos.busId} style={styles.occupancyChip}>
                  <Text style={styles.occupancyChipRoute}>
                    {pos.routeCode ?? pos.plateNumber?.slice(-4)}
                  </Text>
                  <OccupancyPill level={occ.level} />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // Map
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 80,
  },
  mapFallbackText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  mapFallbackSub: {
    color: Colors.textMuted,
    fontSize: 12,
  },

  // Bus markers
  busMarker: {
    backgroundColor: Colors.black,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  busMarkerText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Route filter overlay
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterPill: {
    backgroundColor: `${Colors.white}F0`,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  filterPillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Bottom info panel
  infoPanel: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoPanelHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  infoPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoPanelCount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  infoPanelCountSuffix: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  infoPanelSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.success}16`,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveChipText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
  occupancyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  occupancyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  occupancyChipRoute: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
