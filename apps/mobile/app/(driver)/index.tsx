import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useTripStore } from '../../stores/trip.store';
import { useAuthStore } from '../../stores/auth.store';
import { Colors } from '../../constants/colors';

const CHECKLIST_ITEMS = [
  { key: 'brakes',      label: 'Brakes functional' },
  { key: 'lights',      label: 'Lights operational' },
  { key: 'tires',       label: 'Tires inflated' },
  { key: 'validator',   label: 'Card validator powered on' },
  { key: 'cleanliness', label: 'Bus is clean' },
];

export default function DriverHome() {
  const { user } = useAuthStore();
  const {
    activeTripId, shiftStartTime, tripCount,
    totalFaresCollectedJMD, setActiveTrip, clearTrip,
  } = useTripStore();

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    brakes: false, lights: false, tires: false, validator: false, cleanliness: false,
  });
  const [selectedBusId, setSelectedBusId]     = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => (await api.get('/buses')).data.data,
    enabled: !activeTripId,
  });

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data.data,
    enabled: !activeTripId,
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBusId || !selectedRouteId) throw new Error('Select bus and route');
      if (!Object.values(checklist).every(Boolean)) throw new Error('Complete the pre-trip checklist');
      return (await api.post('/trips/start', {
        busId: selectedBusId, routeId: selectedRouteId, checklist,
      })).data.data;
    },
    onSuccess: (trip) => setActiveTrip(trip.id, trip.routeId, trip.busId),
    onError: (err: any) => Alert.alert('Cannot Start Trip', err.message),
  });

  const endMutation = useMutation({
    mutationFn: async () =>
      (await api.post(`/trips/${activeTripId}/end`, { passengerCount: 0 })).data.data,
    onSuccess: () => {
      clearTrip();
      Alert.alert('Trip Ended', 'Trip ended successfully.');
    },
  });

  const toggleCheck = (key: string) =>
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const checkedCount  = Object.values(checklist).filter(Boolean).length;
  const allChecked    = checkedCount === CHECKLIST_ITEMS.length;
  const canStart      = allChecked && !!selectedBusId && !!selectedRouteId;

  // — Active shift view —
  if (activeTripId) {
    const elapsed = shiftStartTime
      ? Math.floor((Date.now() - shiftStartTime.getTime()) / 60000)
      : 0;
    const hours   = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Shift Active</Text>
        <Text style={styles.pageSubtitle}>Your trip is in progress</Text>

        <View style={styles.shiftCard}>
          <ShiftRow label="Duration"        value={`${hours}h ${minutes}m`} />
          <ShiftRow label="Trips Completed" value={String(tripCount)} />
          <ShiftRow
            label="Fares Collected"
            value={`$${totalFaresCollectedJMD.toLocaleString('en-JM', { minimumFractionDigits: 2 })} JMD`}
            isLast
          />
        </View>

        <TouchableOpacity
          style={styles.endButton}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'End Trip', onPress: () => endMutation.mutate(), style: 'destructive' },
            ])
          }
        >
          {endMutation.isPending
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.endButtonText}>End Trip</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // — Pre-shift setup —
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Start Your Shift</Text>
      <Text style={styles.pageSubtitle}>
        Welcome back, {user?.name?.split(' ')[0]}
      </Text>

      {/* Pre-trip checklist */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Pre-Trip Checklist</Text>
          <Text style={styles.checklistProgress}>
            {checkedCount}/{CHECKLIST_ITEMS.length}
          </Text>
        </View>
        <View style={styles.checklistCard}>
          {CHECKLIST_ITEMS.map(({ key, label }, idx) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.checkItem,
                idx < CHECKLIST_ITEMS.length - 1 && styles.checkItemDivider,
              ]}
              onPress={() => toggleCheck(key)}
              activeOpacity={0.7}
            >
              {checklist[key]
                ? <Check size={18} color={Colors.success} strokeWidth={2} />
                : <Circle size={18} color={Colors.border} strokeWidth={1.5} />
              }
              <Text style={[styles.checkLabel, checklist[key] && styles.checkLabelDone]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bus selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select Bus</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {buses
            ?.filter((b: any) => b.status === 'DEPOT' || b.status === 'IN_SERVICE')
            .slice(0, 8)
            .map((bus: any) => (
              <TouchableOpacity
                key={bus.id}
                style={[styles.chip, selectedBusId === bus.id && styles.chipSelected]}
                onPress={() => setSelectedBusId(bus.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selectedBusId === bus.id && styles.chipTextSelected]}>
                  {bus.plateNumber}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Route selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select Route</Text>
        {routes?.slice(0, 6).map((route: any) => (
          <TouchableOpacity
            key={route.id}
            style={[styles.routeRow, selectedRouteId === route.id && styles.routeRowSelected]}
            onPress={() => setSelectedRouteId(route.id)}
            activeOpacity={0.75}
          >
            <View style={[styles.routeCode, { backgroundColor: `${route.color ?? Colors.primary}20` }]}>
              <Text style={[styles.routeCodeText, { color: route.color ?? Colors.primary }]}>
                {route.code}
              </Text>
            </View>
            <Text style={styles.routeName}>{route.name}</Text>
            {selectedRouteId === route.id && (
              <Check size={16} color={Colors.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Start shift */}
      <TouchableOpacity
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        onPress={() => startMutation.mutate()}
        disabled={startMutation.isPending || !canStart}
        activeOpacity={0.85}
      >
        {startMutation.isPending
          ? <ActivityIndicator color={Colors.white} size="small" />
          : <Text style={styles.startButtonText}>Start Shift</Text>
        }
      </TouchableOpacity>

      {!canStart && (
        <Text style={styles.startHint}>
          {!allChecked
            ? `Complete checklist (${checkedCount}/${CHECKLIST_ITEMS.length})`
            : !selectedBusId
            ? 'Select a bus'
            : 'Select a route'}
        </Text>
      )}
    </ScrollView>
  );
}

function ShiftRow({
  label, value, isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.shiftRow, !isLast && styles.shiftRowDivider]}>
      <Text style={styles.shiftRowLabel}>{label}</Text>
      <Text style={styles.shiftRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 28,
  },

  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checklistProgress: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Checklist
  checklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  checkItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  checkLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
  checkLabelDone: {
    color: Colors.text,
  },

  // Bus chips
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}14`,
  },
  chipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextSelected: {
    color: Colors.primary,
  },

  // Route rows
  routeRow: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeRowSelected: {
    borderColor: Colors.primary,
  },
  routeCode: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 44,
    alignItems: 'center',
  },
  routeCodeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  routeName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },

  // Start button
  startButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    minHeight: 54,
  },
  startButtonDisabled: {
    opacity: 0.35,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  startHint: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },

  // Active shift
  shiftCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  shiftRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  shiftRowLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  shiftRowValue: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  endButton: {
    backgroundColor: Colors.critical,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
  },
  endButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
