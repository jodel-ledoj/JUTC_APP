import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useTripStore } from '../../stores/trip.store';
import { Colors } from '../../constants/colors';

type StopAdherence = {
  stopId: string;
  stopName: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'upcoming' | 'on_time' | 'delayed' | 'skipped';
  delayMinutes?: number;
};

export default function RouteScreen() {
  const { activeTripId, activeRouteId } = useTripStore();
  const [elapsed, setElapsed] = useState(0);
  const [shiftStart] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - shiftStart) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [shiftStart]);

  const { data: tripData } = useQuery({
    queryKey: ['trip', activeTripId],
    queryFn: async () => {
      if (!activeTripId) return null;
      return (await api.get(`/trips/${activeTripId}`)).data.data;
    },
    enabled: !!activeTripId,
    refetchInterval: 30_000,
  });

  const { data: routeStops } = useQuery({
    queryKey: ['route-stops', activeRouteId],
    queryFn: async () => {
      if (!activeRouteId) return [];
      const route = (await api.get(`/routes/${activeRouteId}`)).data.data;
      return route?.stops ?? [];
    },
    enabled: !!activeRouteId,
  });

  const reportDelayMutation = useMutation({
    mutationFn: async (minutes: number) =>
      api.patch(`/trips/${activeTripId}/status`, { status: 'EN_ROUTE', notes: `Delay: ${minutes} minutes` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', activeTripId] });
    },
  });

  const emergencyMutation = useMutation({
    mutationFn: async () =>
      api.post('/incidents', {
        type: 'BREAKDOWN',
        severity: 'CRITICAL',
        description: `Emergency reported by driver on trip ${activeTripId}`,
        tripId: activeTripId,
      }),
    onSuccess: () => Alert.alert('Emergency Reported', 'Control has been notified.'),
  });

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleDelay = (minutes: number) => {
    Alert.alert(
      'Report Delay',
      `Report a ${minutes}-minute delay?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => reportDelayMutation.mutate(minutes) },
      ]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Alert',
      'This will notify JUTC control immediately. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Emergency', style: 'destructive', onPress: () => emergencyMutation.mutate() },
      ]
    );
  };

  if (!activeTripId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No active trip</Text>
        <Text style={styles.emptySubtext}>Start a shift from the Shift tab</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Timer */}
      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Shift Duration</Text>
        <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
        {tripData?.route && (
          <Text style={styles.routeName}>{tripData.route.code} — {tripData.route.name}</Text>
        )}
      </View>

      {/* Delay Shortcuts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Delay</Text>
        <View style={styles.delayRow}>
          {[5, 10, 15, 20, 30].map(min => (
            <TouchableOpacity
              key={min}
              style={styles.delayBtn}
              onPress={() => handleDelay(min)}
              disabled={reportDelayMutation.isPending}
            >
              <Text style={styles.delayBtnText}>+{min}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stop Adherence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stop Progression</Text>
        {routeStops?.map((stop: any, index: number) => (
          <View key={stop.id} style={styles.stopRow}>
            <View style={styles.stopIndicator}>
              <View style={[styles.stopDot, index === 0 && styles.stopDotActive]} />
              {index < routeStops.length - 1 && <View style={styles.stopLine} />}
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{stop.stop?.name ?? `Stop ${index + 1}`}</Text>
              <Text style={styles.stopOrder}>Stop {stop.sequence}</Text>
            </View>
          </View>
        ))}
        {!routeStops?.length && (
          <Text style={styles.emptySubtext}>No stops loaded</Text>
        )}
      </View>

      {/* Emergency */}
      <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergency}>
        <Text style={styles.emergencyText}>🚨 Emergency / Breakdown</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { color: Colors.textMuted, fontSize: 14 },
  timerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerLabel: { color: Colors.textMuted, fontSize: 13, marginBottom: 8 },
  timerValue: { color: Colors.primary, fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'] },
  routeName: { color: Colors.textMuted, fontSize: 13, marginTop: 8 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  delayRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  delayBtn: {
    backgroundColor: `${Colors.warning}22`,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  delayBtnText: { color: Colors.warning, fontSize: 14, fontWeight: '600' },
  stopRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  stopIndicator: { alignItems: 'center', width: 20 },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  stopDotActive: { backgroundColor: Colors.primary },
  stopLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 4 },
  stopInfo: { flex: 1, paddingBottom: 16 },
  stopName: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  stopOrder: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  emergencyBtn: {
    backgroundColor: `${Colors.critical}22`,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.critical,
    marginTop: 8,
  },
  emergencyText: { color: Colors.critical, fontSize: 16, fontWeight: '700' },
});
