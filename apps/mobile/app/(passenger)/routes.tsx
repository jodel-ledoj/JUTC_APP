import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search } from 'lucide-react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { JUTC_ROUTES, type JutcRoute } from '../../lib/jutcRoutes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnrichedRoute extends JutcRoute {
  activeBusCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRouteLabel(fare: number): string {
  return `J$${fare}`;
}

function filterRoutes(routes: EnrichedRoute[], query: string): EnrichedRoute[] {
  if (!query || query.length < 2) return routes;
  const q = query.toLowerCase().trim();
  return routes.filter((r) => {
    const haystack = [r.code, r.name, ...r.stops, ...r.landmarks].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function RouteSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonBadge} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '65%' }]} />
      </View>
    </View>
  );
}

// ── Route Stop List ───────────────────────────────────────────────────────────

const RouteStopList = memo(function RouteStopList({ stops }: { stops: string[] }) {
  return (
    <View style={styles.stopList}>
      {stops.map((stop, index) => (
        <View key={stop + index} style={styles.stopRow}>
          <View style={styles.stopIndicator}>
            <View style={[styles.stopDot, index === 0 && styles.stopDotFirst, index === stops.length - 1 && styles.stopDotLast]} />
            {index < stops.length - 1 && <View style={styles.stopConnector} />}
          </View>
          <Text style={[styles.stopText, (index === 0 || index === stops.length - 1) && styles.stopTextTerminal]}>
            {stop}
          </Text>
        </View>
      ))}
    </View>
  );
});

// ── Route Card ────────────────────────────────────────────────────────────────

const RouteCard = memo(function RouteCard({ route }: { route: EnrichedRoute }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={toggle} activeOpacity={0.75}>
        {/* Route badge */}
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{route.code}</Text>
        </View>

        {/* Route info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{route.name}</Text>
          <Text style={styles.cardStops} numberOfLines={1}>{route.keyStopsAbbrev}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.metaItem}>{buildRouteLabel(route.fareEstimateJMD)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>Every {route.frequencyMinutes} min</Text>
            <Text style={styles.metaDot}>·</Text>
            {route.activeBusCount > 0 ? (
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>{route.activeBusCount} active</Text>
              </View>
            ) : (
              <Text style={styles.metaItemMuted}>No buses live</Text>
            )}
          </View>
        </View>

        {/* Chevron */}
        <View style={styles.chevronWrapper}>
          {expanded
            ? <ChevronUp size={16} color={Colors.textMuted} strokeWidth={1.8} />
            : <ChevronDown size={16} color={Colors.textMuted} strokeWidth={1.8} />
          }
        </View>
      </TouchableOpacity>

      {/* Expanded: full stop list */}
      {expanded && (
        <View style={styles.expandedBody}>
          <View style={styles.expandedDivider} />
          <View style={styles.expandedMeta}>
            <Text style={styles.expandedMetaLabel}>Duration</Text>
            <Text style={styles.expandedMetaValue}>{route.durationMinutes} min</Text>
          </View>
          <View style={styles.expandedMeta}>
            <Text style={styles.expandedMetaLabel}>Fare</Text>
            <Text style={styles.expandedMetaValue}>{buildRouteLabel(route.fareEstimateJMD)}</Text>
          </View>
          <Text style={styles.stopsHeading}>All Stops</Text>
          <RouteStopList stops={route.stops} />
        </View>
      )}
    </View>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const { data: apiRoutes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await api.get('/routes');
      return res.data.data as Array<{ id: string; code: string; activeBusCount?: number }>;
    },
    staleTime: 60_000,
    retry: 1,
  });

  // Merge static route data with live active bus counts from API
  const enrichedRoutes = useMemo<EnrichedRoute[]>(() => {
    return JUTC_ROUTES.map((route) => {
      const liveData = apiRoutes?.find((r) => r.code === route.code);
      return {
        ...route,
        activeBusCount: liveData?.activeBusCount ?? 0,
      };
    });
  }, [apiRoutes]);

  const filtered = useMemo(
    () => filterRoutes(enrichedRoutes, query),
    [enrichedRoutes, query],
  );

  const renderItem = useCallback(
    ({ item }: { item: EnrichedRoute }) => <RouteCard route={item} />,
    [],
  );

  const keyExtractor = useCallback((item: EnrichedRoute) => item.code, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Routes</Text>
        <Text style={styles.headerSub}>{JUTC_ROUTES.length} routes available</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Search size={15} color={Colors.textMuted} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes or stops..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, i) => <RouteSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          windowSize={8}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No routes match "{query}"</Text>
              <Text style={styles.emptyHint}>Try a stop name, landmark, or route number</Text>
            </View>
          }
        />
      )}

      {/* Loading indicator for background refresh */}
      {isRefetching && !isLoading && (
        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={styles.refreshIndicator}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
    fontWeight: '400',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },

  // Route card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  codeBadge: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    minWidth: 44,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  codeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  cardStops: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  metaItemMuted: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '400',
  },
  metaDot: {
    fontSize: 11,
    color: Colors.border,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.success}14`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activePillText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  chevronWrapper: {
    padding: 4,
  },

  // Expanded body
  expandedBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: 14,
  },
  expandedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expandedMetaLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  expandedMetaValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  stopsHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 10,
  },

  // Stop list (within expanded card)
  stopList: {
    gap: 0,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 28,
  },
  stopIndicator: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 4,
  },
  stopDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
  },
  stopDotFirst: {
    backgroundColor: Colors.primary,
    borderColor: Colors.black,
  },
  stopDotLast: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  stopConnector: {
    width: 1.5,
    flex: 1,
    minHeight: 16,
    backgroundColor: Colors.border,
    marginTop: 2,
    marginBottom: -2,
  },
  stopText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
    lineHeight: 20,
    paddingBottom: 8,
  },
  stopTextTerminal: {
    color: Colors.text,
    fontWeight: '600',
  },

  // Skeleton
  skeletonContainer: {
    padding: 16,
    gap: 10,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skeletonBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  skeletonBody: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surface2,
    width: '80%',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Refresh indicator
  refreshIndicator: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
  },
});
