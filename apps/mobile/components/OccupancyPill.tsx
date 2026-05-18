import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OccupancyLevel, OCCUPANCY_LABELS, OCCUPANCY_COLORS } from '../constants/occupancy';

interface Props {
  level: OccupancyLevel;
  /** Show the bar + label inline (default) or just the bar */
  compact?: boolean;
}

/** Number of filled segments per level */
const SEGMENT_COUNTS: Record<OccupancyLevel, number> = {
  LOW: 1,
  MODERATE: 2,
  BUSY: 3,
  FULL: 4,
};

const TOTAL_SEGMENTS = 4;

/**
 * Subtle occupancy indicator — a small segmented bar with a text label.
 * Designed to be informative without alarming.
 */
export function OccupancyPill({ level, compact = false }: Props) {
  const color = OCCUPANCY_COLORS[level];
  const label = OCCUPANCY_LABELS[level];
  const filledCount = SEGMENT_COUNTS[level];

  return (
    <View style={styles.row}>
      <View style={styles.barContainer}>
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < filledCount ? color : `${color}30` },
            ]}
          />
        ))}
      </View>
      {!compact && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barContainer: {
    flexDirection: 'row',
    gap: 1.5,
    alignItems: 'center',
  },
  segment: {
    width: 4,
    height: 8,
    borderRadius: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
