import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import {
  MapPin, AlertTriangle, ShieldAlert, CreditCard, Wrench, FileText,
} from 'lucide-react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/colors';

const INCIDENT_TYPES = [
  { key: 'MISSED_STOP',       label: 'Missed Stop',       Icon: MapPin },
  { key: 'RECKLESS_DRIVING',  label: 'Reckless Driving',  Icon: AlertTriangle },
  { key: 'HARASSMENT',        label: 'Harassment',        Icon: ShieldAlert },
  { key: 'OVERCHARGING',      label: 'Overcharging',      Icon: CreditCard },
  { key: 'BROKEN_EQUIPMENT',  label: 'Broken Equipment',  Icon: Wrench },
  { key: 'OTHER',             label: 'Other',             Icon: FileText },
];

export default function ReportScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSafety, setIsSafety] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) throw new Error('Select an incident type');
      if (description.length < 10) throw new Error('Please provide more detail');
      return (await api.post('/incidents', {
        type: selectedType,
        description,
        severity: isSafety ? 'CRITICAL' : 'MEDIUM',
      })).data.data;
    },
    onSuccess: () => {
      Alert.alert('Report Submitted', "We'll review your report within 24 hours.");
      setSelectedType(null);
      setDescription('');
      setIsSafety(false);
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const canSubmit = selectedType !== null && description.length >= 10;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Report an Issue</Text>
      <Text style={styles.subtitle}>Select what happened and describe the incident</Text>

      {/* Incident type */}
      <Text style={styles.sectionLabel}>Incident Type</Text>
      <View style={styles.typeGrid}>
        {INCIDENT_TYPES.map(({ key, label, Icon }) => {
          const isSelected = selectedType === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.typeCard, isSelected && styles.typeCardSelected]}
              onPress={() => setSelectedType(isSelected ? null : key)}
              activeOpacity={0.75}
            >
              <Icon
                size={20}
                color={isSelected ? Colors.primary : Colors.textMuted}
                strokeWidth={1.5}
              />
              <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Description */}
      <Text style={styles.sectionLabel}>What happened?</Text>
      <TextInput
        style={styles.textArea}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the incident in detail..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        maxLength={1000}
      />
      <Text style={styles.charCount}>{description.length}/1000</Text>

      {/* Safety flag */}
      <TouchableOpacity
        style={[styles.safetyRow, isSafety && styles.safetyRowActive]}
        onPress={() => setIsSafety((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={[styles.safetyToggleTrack, isSafety && styles.safetyToggleTrackActive]}>
          <View style={[styles.safetyToggleThumb, isSafety && styles.safetyToggleThumbActive]} />
        </View>
        <View style={styles.safetyTextGroup}>
          <Text style={[styles.safetyTitle, isSafety && styles.safetyTitleActive]}>
            Safety emergency
          </Text>
          <Text style={styles.safetyDesc}>Mark if this poses an immediate risk</Text>
        </View>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending || !canSubmit}
        activeOpacity={0.85}
      >
        {mutation.isPending
          ? <ActivityIndicator color={Colors.white} size="small" />
          : <Text style={styles.submitText}>Submit Report</Text>
        }
      </TouchableOpacity>

      <Text style={styles.slaNote}>Reports reviewed within 24 hours</Text>
    </ScrollView>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 28,
    lineHeight: 20,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Incident type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  typeCard: {
    width: '30.5%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}12`,
  },
  typeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: Colors.primary,
  },

  // Description
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    marginBottom: 6,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 24,
  },

  // Safety toggle
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 13,
    padding: 16,
    gap: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  safetyRowActive: {
    borderColor: Colors.critical,
    backgroundColor: `${Colors.critical}10`,
  },
  safetyToggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  safetyToggleTrackActive: {
    backgroundColor: Colors.critical,
    borderColor: Colors.critical,
  },
  safetyToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textMuted,
    alignSelf: 'flex-start',
  },
  safetyToggleThumbActive: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-end',
  },
  safetyTextGroup: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  safetyTitleActive: {
    color: Colors.critical,
    fontWeight: '600',
  },
  safetyDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Submit
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.35,
  },
  submitText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  slaNote: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
});
