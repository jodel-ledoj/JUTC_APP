import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  routeCode?: string;
  occupancyLevel?: string | null;
}

export const BusMarker = memo(function BusMarker({ routeCode, occupancyLevel }: Props) {
  const dotColor =
    occupancyLevel === 'FULL' ? Colors.critical
    : occupancyLevel === 'BUSY' ? Colors.warning
    : Colors.success;

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        <Text style={styles.code}>{routeCode?.slice(0, 3) ?? 'BUS'}</Text>
      </View>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 2 },
  pill: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 38,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  code: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.white,
  },
});
