import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { ChevronRight, ArrowLeftRight, MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import {
  POPULAR_DESTINATIONS,
  findRoutesForTrip,
  type RouteSearchResult,
} from '../../lib/jutcRoutes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  query: string;
  results: RouteSearchResult[];
  onSelect: (r: RouteSearchResult) => void;
}

type PanelMode = 'routes' | 'trip';

// ── Mode Toggle ───────────────────────────────────────────────────────────────

const ModeToggle = memo(function ModeToggle({
  mode,
  onToggle,
}: {
  mode: PanelMode;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.modeToggle} onPress={onToggle} activeOpacity={0.75}>
      <ArrowLeftRight size={12} color={Colors.textMuted} strokeWidth={2} />
      <Text style={styles.modeToggleText}>
        {mode === 'routes' ? 'Plan a Trip' : 'Search Routes'}
      </Text>
    </TouchableOpacity>
  );
});

// ── Route Result Row ──────────────────────────────────────────────────────────

const RouteResultRow = memo(function RouteResultRow({
  result,
  onPress,
}: {
  result: RouteSearchResult;
  onPress: () => void;
}) {
  const { route, matchType, transferRoute, fareEstimateJMD, durationMinutes } = result;

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.routeCodePill}>
        <Text style={styles.routeCode}>{route.code}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{route.name}</Text>
        <Text style={styles.stopsPreview} numberOfLines={1}>
          {route.keyStopsAbbrev}
        </Text>
        <View style={styles.resultMeta}>
          <Text style={styles.metaText}>{durationMinutes} min</Text>
          <Text style={styles.metaDot}>{'\u00B7'}</Text>
          <Text style={styles.metaText}>J${fareEstimateJMD}</Text>
          <Text style={styles.metaDot}>{'\u00B7'}</Text>
          <Text style={styles.metaText}>Every {route.frequencyMinutes} min</Text>
        </View>
        {matchType === 'transfer' && transferRoute && (
          <View style={styles.transferTagContainer}>
            <Text style={styles.transferTag}>
              Transfer at {transferRoute.stops[0]} {'\u2192'} Route {transferRoute.code}
            </Text>
          </View>
        )}
      </View>
      <ChevronRight size={14} color={Colors.textMuted} strokeWidth={1.5} />
    </TouchableOpacity>
  );
});

// ── Trip Plan Result Row ──────────────────────────────────────────────────────

const TripResultRow = memo(function TripResultRow({
  result,
  onPress,
}: {
  result: RouteSearchResult;
  onPress: () => void;
}) {
  const { route, matchType, transferRoute, fareEstimateJMD, durationMinutes } = result;
  const isDirect = matchType === 'direct';

  return (
    <TouchableOpacity style={styles.tripResultCard} onPress={onPress} activeOpacity={0.75}>
      {/* Label row */}
      <View style={styles.tripCardHeader}>
        <View style={styles.routeCodePill}>
          <Text style={styles.routeCode}>{route.code}</Text>
        </View>
        <View style={[styles.tripTypePill, isDirect ? styles.tripTypePillDirect : styles.tripTypePillTransfer]}>
          <Text style={[styles.tripTypeText, isDirect ? styles.tripTypeTextDirect : styles.tripTypeTextTransfer]}>
            {isDirect ? 'Direct' : transferRoute ? `Transfer at ${transferRoute.stops[0]}` : 'Transfer'}
          </Text>
        </View>
      </View>

      {/* Route name */}
      <Text style={styles.tripRouteName} numberOfLines={1}>{route.name}</Text>

      {/* Transfer leg */}
      {!isDirect && transferRoute && (
        <Text style={styles.tripTransferLeg} numberOfLines={1}>
          then Route {transferRoute.code}: {transferRoute.name}
        </Text>
      )}

      {/* Stats row */}
      <View style={styles.tripStats}>
        <View style={styles.tripStatItem}>
          <Text style={styles.tripStatValue}>{durationMinutes} min</Text>
          <Text style={styles.tripStatLabel}>duration</Text>
        </View>
        <View style={styles.tripStatDivider} />
        <View style={styles.tripStatItem}>
          <Text style={styles.tripStatValue}>J${fareEstimateJMD}</Text>
          <Text style={styles.tripStatLabel}>fare est.</Text>
        </View>
        <View style={styles.tripStatDivider} />
        <View style={styles.tripStatItem}>
          <Text style={styles.tripStatValue}>0 buses</Text>
          <Text style={styles.tripStatLabel}>live now</Text>
        </View>
      </View>

      {/* View on map button */}
      <TouchableOpacity style={styles.viewOnMapBtn} onPress={onPress} activeOpacity={0.8}>
        <MapPin size={12} color={Colors.text} strokeWidth={2} />
        <Text style={styles.viewOnMapText}>View on Map</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ── Trip Planner Sub-Panel ────────────────────────────────────────────────────

function TripPlannerPanel({ onSelect }: { onSelect: (r: RouteSearchResult) => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [results, setResults] = useState<RouteSearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(() => {
    if (!from.trim() || !to.trim()) return;
    const found = findRoutesForTrip(from.trim(), to.trim());
    setResults(found);
    setSearched(true);
  }, [from, to]);

  return (
    <View style={styles.tripPlanner}>
      {/* From input */}
      <View style={styles.tripInputRow}>
        <View style={styles.tripInputDot} />
        <TextInput
          style={styles.tripInput}
          placeholder="From (e.g. Half Way Tree)"
          placeholderTextColor={Colors.textMuted}
          value={from}
          onChangeText={setFrom}
          returnKeyType="next"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tripInputConnector} />

      {/* To input */}
      <View style={styles.tripInputRow}>
        <View style={[styles.tripInputDot, styles.tripInputDotDest]} />
        <TextInput
          style={styles.tripInput}
          placeholder="To (e.g. Downtown Kingston)"
          placeholderTextColor={Colors.textMuted}
          value={to}
          onChangeText={setTo}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCorrect={false}
        />
      </View>

      {/* Search button */}
      <TouchableOpacity
        style={[styles.tripSearchBtn, (!from.trim() || !to.trim()) && styles.tripSearchBtnDisabled]}
        onPress={handleSearch}
        activeOpacity={0.85}
        disabled={!from.trim() || !to.trim()}
      >
        <Text style={styles.tripSearchBtnText}>Find Routes</Text>
      </TouchableOpacity>

      {/* Results */}
      {searched && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No routes found for this trip</Text>
          <Text style={styles.emptyHint}>Try adjusting your stop names</Text>
        </View>
      )}

      {results.map((result) => (
        <TripResultRow
          key={result.route.code}
          result={result}
          onPress={() => onSelect(result)}
        />
      ))}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const SearchPanel = memo(function SearchPanel({ query, results, onSelect }: Props) {
  const [mode, setMode] = useState<PanelMode>('routes');

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'routes' ? 'trip' : 'routes'));
  }, []);

  // ── Trip planning mode ────────────────────────────────────────────────────

  if (mode === 'trip') {
    return (
      <View style={styles.container}>
        <View style={styles.modeBar}>
          <Text style={styles.modePanelTitle}>Plan a Trip</Text>
          <ModeToggle mode={mode} onToggle={toggleMode} />
        </View>
        <TripPlannerPanel onSelect={onSelect} />
      </View>
    );
  }

  // ── Route search mode ─────────────────────────────────────────────────────

  if (query.length < 2) {
    return (
      <View style={styles.container}>
        <View style={styles.modeBar}>
          <Text style={styles.sectionLabel}>Popular Destinations</Text>
          <ModeToggle mode={mode} onToggle={toggleMode} />
        </View>
        {POPULAR_DESTINATIONS.map((d) => (
          <TouchableOpacity key={d.name} style={styles.destRow} activeOpacity={0.7}>
            <View style={styles.destIcon}>
              <Text style={styles.destEmoji}>{d.icon}</Text>
            </View>
            <Text style={styles.destName}>{d.name}</Text>
            <ChevronRight size={14} color={Colors.textMuted} strokeWidth={1.5} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.modeBar}>
          <View />
          <ModeToggle mode={mode} onToggle={toggleMode} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No routes found for "{query}"</Text>
          <Text style={styles.emptyHint}>Try a stop name or landmark</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.modeBar}>
        <Text style={styles.sectionLabel}>Routes</Text>
        <ModeToggle mode={mode} onToggle={toggleMode} />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.route.code}
        renderItem={({ item }) => <RouteResultRow result={item} onPress={() => onSelect(item)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsList}
        keyboardShouldPersistTaps="handled"
        windowSize={5}
        maxToRenderPerBatch={8}
      />
    </View>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Mode bar
  modeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modePanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Popular destinations
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  destIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destEmoji: {
    fontSize: 16,
  },
  destName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 4,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Route results
  resultsList: {
    paddingBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  routeCodePill: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  routeCode: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultInfo: {
    flex: 1,
    gap: 3,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  stopsPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  transferTagContainer: {
    marginTop: 3,
  },
  transferTag: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Trip planner
  tripPlanner: {
    gap: 0,
  },
  tripInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripInputConnector: {
    width: 1.5,
    height: 10,
    backgroundColor: Colors.border,
    marginLeft: 21,
  },
  tripInputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  tripInputDotDest: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  tripInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    padding: 0,
  },
  tripSearchBtn: {
    backgroundColor: Colors.black,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  tripSearchBtnDisabled: {
    backgroundColor: Colors.surface2,
  },
  tripSearchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.2,
  },

  // Trip result cards
  tripResultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tripTypePillDirect: {
    backgroundColor: `${Colors.success}14`,
    borderWidth: 1,
    borderColor: `${Colors.success}28`,
  },
  tripTypePillTransfer: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: `${Colors.warning}40`,
  },
  tripTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tripTypeTextDirect: {
    color: Colors.success,
  },
  tripTypeTextTransfer: {
    color: Colors.warning,
  },
  tripRouteName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  tripTransferLeg: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  tripStats: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tripStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  tripStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tripStatDivider: {
    width: 1,
    height: '70%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  viewOnMapText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
});
