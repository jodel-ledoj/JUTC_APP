import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { X, Navigation2, Gauge, Users, MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { JUTC_ROUTES } from '../../lib/jutcRoutes';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_H * 0.56;
const BUS_CAPACITY = 78;

// ── Types ────────────────────────────────────────────────────────────────────

interface BusPosition {
  busId: string;
  routeCode: string | null;
  routeId: string | null;
  plateNumber: string;
  speed: number;
  heading: number;
  latitude: number;
  longitude: number;
  passengerCount?: number;
}

interface BusDetailSheetProps {
  visible: boolean;
  busPosition: BusPosition | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function headingToCompass(heading: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading % 360) + 360) % 360 / 45) % 8;
  return dirs[index];
}

function getOccupancyColor(ratio: number): string {
  if (ratio >= 0.85) return Colors.critical;
  if (ratio >= 0.6) return Colors.warning;
  return Colors.success;
}

function estimateEta(speed: number): number {
  // Rough ETA to next stop — assume ~1.5 km average stop gap
  if (!speed || speed < 2) return 8;
  return Math.max(1, Math.round(1.5 / (speed / 60)));
}

// ── Live Pulse Dot ────────────────────────────────────────────────────────────

function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.liveBadge}>
      <View style={styles.liveDotWrapper}>
        <Animated.View style={[styles.liveDotPulse, { transform: [{ scale: pulse }] }]} />
        <View style={styles.liveDotCore} />
      </View>
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BusDetailSheet({ visible, busPosition, onClose }: BusDetailSheetProps) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 14,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleTrack = useCallback(() => {
    onClose();
    router.push({
      pathname: '/(passenger)/tracking',
      params: busPosition?.routeId ? { routeId: busPosition.routeId } : {},
    });
  }, [busPosition, onClose]);

  if (!busPosition && !visible) return null;

  const route = busPosition?.routeCode
    ? JUTC_ROUTES.find((r) => r.code === busPosition.routeCode) ?? null
    : null;

  const occupancyCount = busPosition?.passengerCount ?? 0;
  const occupancyRatio = Math.min(occupancyCount / BUS_CAPACITY, 1);
  const occupancyBarColor = getOccupancyColor(occupancyRatio);
  const eta = busPosition ? estimateEta(busPosition.speed) : 0;
  const compass = busPosition ? headingToCompass(busPosition.heading) : '--';
  const firstThreeStops = route?.stops.slice(0, 3) ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.routeBadge}>
              <Text style={styles.routeBadgeText}>
                {busPosition?.routeCode ?? 'BUS'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.routeName} numberOfLines={1}>
                {route?.name ?? 'Unknown Route'}
              </Text>
              <Text style={styles.plateNumber}>{busPosition?.plateNumber ?? '--'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <LiveDot />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={Colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Gauge size={14} color={Colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.statValue}>{Math.round(busPosition?.speed ?? 0)}</Text>
            <Text style={styles.statUnit}>km/h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Navigation2 size={14} color={Colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.statValue}>{compass}</Text>
            <Text style={styles.statUnit}>direction</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Users size={14} color={Colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.statValue}>{occupancyCount}</Text>
            <Text style={styles.statUnit}>/ {BUS_CAPACITY}</Text>
          </View>
        </View>

        {/* Occupancy bar */}
        <View style={styles.occupancySection}>
          <View style={styles.occupancyLabelRow}>
            <Text style={styles.sectionLabel}>Occupancy</Text>
            <Text style={[styles.occupancyPct, { color: occupancyBarColor }]}>
              {Math.round(occupancyRatio * 100)}%
            </Text>
          </View>
          <View style={styles.occupancyTrack}>
            <View
              style={[
                styles.occupancyFill,
                { width: `${Math.round(occupancyRatio * 100)}%`, backgroundColor: occupancyBarColor },
              ]}
            />
          </View>
        </View>

        {/* Stops */}
        {firstThreeStops.length > 0 && (
          <View style={styles.stopsSection}>
            <Text style={styles.sectionLabel}>Upcoming Stops</Text>
            {firstThreeStops.map((stop, index) => (
              <View key={stop} style={styles.stopRow}>
                <View style={styles.stopIndicator}>
                  <View style={[styles.stopDot, index === 0 && styles.stopDotActive]} />
                  {index < firstThreeStops.length - 1 && <View style={styles.stopLine} />}
                </View>
                <Text style={[styles.stopName, index === 0 && styles.stopNameActive]}>
                  {stop}
                </Text>
                {index === 0 && (
                  <Text style={styles.stopEta}>~{eta} min</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ETA row */}
        <View style={styles.etaRow}>
          <MapPin size={13} color={Colors.textMuted} strokeWidth={1.8} />
          <Text style={styles.etaText}>
            Est. arrival at next stop:{'  '}
            <Text style={styles.etaHighlight}>~{eta} min</Text>
          </Text>
        </View>

        {/* Track button */}
        <TouchableOpacity style={styles.trackBtn} onPress={handleTrack} activeOpacity={0.85}>
          <Navigation2 size={15} color={Colors.black} strokeWidth={2} />
          <Text style={styles.trackBtnText}>Track This Bus</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,31,36,0.2)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  routeBadge: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 46,
    alignItems: 'center',
  },
  routeBadgeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  plateNumber: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Live badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Colors.success}14`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.success}28`,
  },
  liveDotWrapper: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotPulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${Colors.success}40`,
  },
  liveDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },

  // Occupancy
  occupancySection: {
    marginBottom: 20,
  },
  occupancyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  occupancyPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  occupancyTrack: {
    height: 6,
    backgroundColor: Colors.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Stops
  stopsSection: {
    marginBottom: 16,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  stopIndicator: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
  },
  stopDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.black,
  },
  stopLine: {
    width: 1.5,
    height: 18,
    backgroundColor: Colors.border,
    marginTop: 2,
  },
  stopName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  stopNameActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  stopEta: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    marginLeft: 8,
  },

  // ETA
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  etaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  etaHighlight: {
    color: Colors.text,
    fontWeight: '700',
  },

  // Track button
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.2,
  },
});
