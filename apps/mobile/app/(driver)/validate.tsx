import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle, ScanLine } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useTripStore } from '../../stores/trip.store';
import { Colors } from '../../constants/colors';

type ValidationStatus = 'idle' | 'approved' | 'insufficient' | 'blocked' | 'duplicate' | 'error';

interface ValidationResult {
  status: ValidationStatus;
  fareAmount: number;
  message: string;
}

const OVERRIDE_REASONS = [
  'Validator malfunction',
  'Network offline',
  'Child passenger (under 3)',
  'Emergency boarding',
  'Supervisor approved',
];

export default function ValidateScreen() {
  const { activeTripId, activeBusId, incrementFares } = useTripStore();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [recentValidations, setRecentValidations] = useState<ValidationResult[]>([]);
  const [overrideVisible, setOverrideVisible] = useState(false);

  const tapMutation = useMutation({
    mutationFn: async (data: { cardId: string; overrideReason?: string }) => {
      return (await api.post('/smartcard/tap', {
        cardId: data.cardId,
        busId: activeBusId ?? 'demo-bus',
        validatorId: 'onboard-1',
        tripId: activeTripId ?? undefined,
        overrideReason: data.overrideReason,
      })).data.data;
    },
    onSuccess: (data) => {
      const result: ValidationResult = {
        status: 'approved',
        fareAmount: data.transaction?.amountJMD ?? 100,
        message: `$${Number(data.transaction?.amountJMD ?? 100).toFixed(2)} JMD collected`,
      };
      setValidationResult(result);
      setRecentValidations((prev) => [result, ...prev.slice(0, 4)]);
      incrementFares(result.fareAmount);
      setTimeout(() => setValidationResult(null), 3000);
    },
    onError: (err: any) => {
      const code = err.response?.data?.error?.code;
      const result: ValidationResult = {
        status: code === 'INSUFFICIENT_FUNDS' ? 'insufficient' : code === 'CARD_BLOCKED' ? 'blocked' : 'error',
        fareAmount: 0,
        message: err.response?.data?.error?.message ?? 'Validation failed',
      };
      setValidationResult(result);
      setTimeout(() => setValidationResult(null), 4000);
    },
  });

  const simulateTap = () => {
    // In production this comes from NFC/QR scanner
    tapMutation.mutate({ cardId: 'demo-card-id' });
  };

  const statusConfig = {
    idle: { color: Colors.primary, icon: ScanLine, text: 'TAP CARD OR SCAN QR' },
    approved: { color: Colors.success, icon: CheckCircle, text: 'APPROVED' },
    insufficient: { color: Colors.critical, icon: XCircle, text: 'INSUFFICIENT FUNDS' },
    blocked: { color: Colors.critical, icon: XCircle, text: 'CARD BLOCKED' },
    duplicate: { color: Colors.warning, icon: AlertCircle, text: 'DUPLICATE TAP' },
    error: { color: Colors.warning, icon: AlertCircle, text: 'VALIDATION ERROR' },
  };

  const current = statusConfig[validationResult?.status ?? 'idle'];
  const StatusIcon = current.icon;

  return (
    <View style={styles.container}>
      {/* Main Validation Panel */}
      <TouchableOpacity style={[styles.validationPanel, { borderColor: current.color }]} onPress={simulateTap}>
        <StatusIcon size={64} color={current.color} />
        <Text style={[styles.statusText, { color: current.color }]}>{current.text}</Text>
        {validationResult?.message && (
          <Text style={styles.statusMessage}>{validationResult.message}</Text>
        )}
        {!validationResult && <Text style={styles.tapHint}>Tap to simulate scan</Text>}
      </TouchableOpacity>

      {/* Manual Override */}
      <TouchableOpacity style={styles.overrideButton} onPress={() => setOverrideVisible(true)}>
        <Text style={styles.overrideText}>Manual Override</Text>
      </TouchableOpacity>

      {/* Recent Validations */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>Recent Validations</Text>
        <FlatList
          data={recentValidations}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={styles.recentItem}>
              {item.status === 'approved'
                ? <CheckCircle size={16} color={Colors.success} />
                : <XCircle size={16} color={Colors.critical} />
              }
              <Text style={styles.recentText}>{item.message}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noRecent}>No validations yet</Text>}
        />
      </View>

      {/* Override Modal */}
      {overrideVisible && (
        <View style={styles.overrideModal}>
          <Text style={styles.overrideTitle}>Select Override Reason</Text>
          {OVERRIDE_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={styles.overrideOption}
              onPress={() => {
                setOverrideVisible(false);
                tapMutation.mutate({ cardId: 'demo-card-id', overrideReason: reason });
              }}
            >
              <Text style={styles.overrideOptionText}>{reason}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.overrideCancel} onPress={() => setOverrideVisible(false)}>
            <Text style={styles.overrideCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  validationPanel: { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 2, padding: 40, alignItems: 'center', gap: 16, marginBottom: 16 },
  statusText: { fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  statusMessage: { fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
  tapHint: { fontSize: 13, color: Colors.textSecondary },
  overrideButton: { backgroundColor: Colors.surface2, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  overrideText: { color: Colors.warning, fontWeight: '600' },
  recentSection: { flex: 1 },
  recentTitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  recentText: { fontSize: 13, color: Colors.textPrimary },
  noRecent: { color: Colors.textSecondary, textAlign: 'center', marginTop: 20 },
  overrideModal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  overrideTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  overrideOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  overrideOptionText: { fontSize: 15, color: Colors.textPrimary },
  overrideCancel: { marginTop: 12, padding: 16, alignItems: 'center' },
  overrideCancelText: { color: Colors.textSecondary, fontSize: 15 },
});
