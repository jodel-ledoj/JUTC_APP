import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { JUTC_ROUTES } from '../../lib/jutcRoutes';

interface Props {
  nearbyTrips: any[];
  notifications: any[];
}

/**
 * Horizontal scrollable strip of compact intelligence pills.
 * Shows proactive transit info: next arrivals, occupancy warnings, alerts.
 * Returns null when there is no live data to display.
 */
export const TransitIntelStrip = memo(function TransitIntelStrip({
  nearbyTrips,
  notifications,
}: Props) {
  const pills: { key: string; label: string; variant: 'default' | 'warning' | 'alert' }[] = [];

  // Estimated next arrivals from nearby trips
  for (const trip of nearbyTrips.slice(0, 3)) {
    const routeCode = trip.route?.code ?? trip.routeCode;
    const route = JUTC_ROUTES.find((r) => r.code === routeCode);
    if (!route) continue;

    const etaMin = trip.estimatedArrivalMin ?? route.frequencyMinutes ?? null;
    if (etaMin != null) {
      pills.push({
        key: `eta-${trip.id}`,
        label: `Route ${routeCode} \u00B7 Next in ~${etaMin} min`,
        variant: 'default',
      });
    }

    // Occupancy warning
    if (trip.passengerCount != null && trip.bus?.capacity) {
      const pct = Math.round((trip.passengerCount / trip.bus.capacity) * 100);
      if (pct > 60) {
        pills.push({
          key: `occ-${trip.id}`,
          label: `Route ${routeCode} \u00B7 ${pct > 85 ? 'Crowded' : 'Filling up'}`,
          variant: 'warning',
        });
      }
    }
  }

  // Service alerts (compact)
  const activeAlerts = (notifications ?? []).filter(
    (n: any) => n.severity === 'CRITICAL' || n.severity === 'WARNING',
  );
  for (const alert of activeAlerts.slice(0, 2)) {
    pills.push({
      key: `alert-${alert.id}`,
      label: alert.title ?? 'Service alert',
      variant: 'alert',
    });
  }

  // No live data — don't render the strip
  if (pills.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {pills.map((pill) => (
        <View
          key={pill.key}
          style={[
            styles.pill,
            pill.variant === 'warning' && styles.pillWarning,
            pill.variant === 'alert' && styles.pillAlert,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              pill.variant === 'warning' && styles.pillTextWarning,
              pill.variant === 'alert' && styles.pillTextAlert,
            ]}
            numberOfLines={1}
          >
            {pill.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 12,
  },
  container: {
    gap: 8,
    paddingHorizontal: 2,
  },
  pill: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillWarning: {
    borderColor: '#D9770620',
    backgroundColor: '#FEF3C7',
  },
  pillAlert: {
    borderColor: '#DC262620',
    backgroundColor: '#FEE2E2',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  pillTextWarning: {
    color: '#92400E',
  },
  pillTextAlert: {
    color: '#991B1B',
  },
});
