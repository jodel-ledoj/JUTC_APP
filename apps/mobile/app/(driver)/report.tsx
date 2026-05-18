import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTripStore } from '../../stores/trip.store';
import { Colors } from '../../constants/colors';

const INCIDENT_TYPES = [
  { key: 'BREAKDOWN', label: 'Breakdown', icon: '🔧', severity: 'CRITICAL' },
  { key: 'ACCIDENT', label: 'Accident', icon: '💥', severity: 'HIGH' },
  { key: 'PASSENGER_INCIDENT', label: 'Passenger Incident', icon: '👤', severity: 'HIGH' },
  { key: 'ROAD_HAZARD', label: 'Road Hazard', icon: '⚠️', severity: 'MEDIUM' },
  { key: 'MECHANICAL_ISSUE', label: 'Mechanical', icon: '⚙️', severity: 'MEDIUM' },
  { key: 'OTHER', label: 'Other', icon: '📋', severity: 'LOW' },
] as const;

export default function DriverReportScreen() {
  const { activeTripId } = useTripStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const incident = INCIDENT_TYPES.find(t => t.key === selectedType);
      return (await api.post('/incidents', {
        type: selectedType,
        severity: isEmergency ? 'CRITICAL' : incident?.severity ?? 'MEDIUM',
        description: description.trim(),
        tripId: activeTripId ?? undefined,
      })).data.data;
    },
    onSuccess: () => {
      Alert.alert('Report Submitted', 'JUTC control has been notified.');
      setSelectedType(null);
      setDescription('');
      setIsEmergency(false);
    },
    onError: () => Alert.alert('Error', 'Failed to submit report. Please try again.'),
  });

  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert('Select Type', 'Please select an incident type.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a brief description.');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Incident Report</Text>

      {/* Type Selection */}
      <Text style={styles.label}>Incident Type</Text>
      <View style={styles.grid}>
        {INCIDENT_TYPES.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.typeCard, selectedType === item.key && styles.typeCardSelected]}
            onPress={() => setSelectedType(item.key)}
          >
            <Text style={styles.typeIcon}>{item.icon}</Text>
            <Text style={[styles.typeLabel, selectedType === item.key && styles.typeLabelSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Toggle */}
      <TouchableOpacity
        style={[styles.emergencyToggle, isEmergency && styles.emergencyToggleActive]}
        onPress={() => setIsEmergency(v => !v)}
      >
        <Text style={[styles.emergencyToggleText, isEmergency && styles.emergencyToggleTextActive]}>
          {isEmergency ? '🚨 Emergency Active — Control Notified' : '🚨 Mark as Emergency'}
        </Text>
      </TouchableOpacity>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textArea}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe what happened..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitMutation.isPending && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Submit Report</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { color: Colors.text, fontSize: 24, fontWeight: '700', marginBottom: 20 },
  label: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 10, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  typeCard: {
    width: '30%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeCardSelected: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}22` },
  typeIcon: { fontSize: 24, marginBottom: 6 },
  typeLabel: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
  typeLabelSelected: { color: Colors.primary, fontWeight: '600' },
  emergencyToggle: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  emergencyToggleActive: {
    borderColor: Colors.critical,
    backgroundColor: `${Colors.critical}22`,
  },
  emergencyToggleText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  emergencyToggleTextActive: { color: Colors.critical },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
