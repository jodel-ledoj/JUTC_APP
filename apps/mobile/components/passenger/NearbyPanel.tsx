import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { OccupancyPill } from '../OccupancyPill';
import { getOccupancyLevel } from '../../constants/occupancy';

interface Props {
  trips: any[];
  occupancyMap: Record<string, any>;
}

export const NearbyPanel = memo(function NearbyPanel({ trips, occupancyMap }: Props) {
  const showEmptyState = trips.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Nearby Buses</Text>
        <TouchableOpacity onPress={() => router.push('/(passenger)/tracking')} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Track live →</Text>
        </TouchableOpacity>
      </View>

      {showEmptyState ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIconText}>🚌</Text>
          </View>
          <Text style={styles.emptyTitle}>No buses nearby</Text>
          <Text style={styles.emptySubtext}>Check Routes tab for schedules</Text>
          <TouchableOpacity
            onPress={() => router.push('/(passenger)/routes')}
            activeOpacity={0.75}
          >
            <Text style={styles.emptyLink}>View all routes →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        trips.slice(0, 3).map((trip: any) => {
          const occ = occupancyMap[trip.bus?.id];
          const occLevel = occ
            ? occ.level
            : trip.passengerCount != null && trip.bus?.capacity
            ? getOccupancyLevel(Math.round((trip.passengerCount / trip.bus.capacity) * 100))
            : null;

          return (
            <TouchableOpacity
              key={trip.id}
              style={styles.busRow}
              onPress={() => router.push('/(passenger)/tracking')}
              activeOpacity={0.75}
            >
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{trip.route?.code}</Text>
              </View>
              <View style={styles.busInfo}>
                <Text style={styles.busName} numberOfLines={1}>{trip.route?.name}</Text>
                <View style={styles.busMeta}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                  {occLevel && (
                    <>
                      <Text style={styles.metaDivider}>{'\u00B7'}</Text>
                      <OccupancyPill level={occLevel} />
                    </>
                  )}
                </View>
              </View>
              <ChevronRight size={14} color={Colors.textMuted} strokeWidth={1.5} />
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
});


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  seeAll: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  codeBlock: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  codeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  busInfo: {
    flex: 1,
    gap: 3,
  },
  busName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  busMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  metaDivider: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconText: {
    fontSize: 22,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '400',
  },
  emptyLink: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
});
