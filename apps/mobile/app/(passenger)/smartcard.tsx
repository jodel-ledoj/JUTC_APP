import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, Alert, ActivityIndicator, TextInput, Animated,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { ArrowDownLeft, ArrowUpRight, X, HelpCircle, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { saveQRTicket, getQRTicket } from '../../lib/storage';
import { Colors } from '../../constants/colors';
import { formatJMD } from '../../constants/currency';
import { useAuthStore } from '../../stores/auth.store';

// ── Constants ────────────────────────────────────────────────────────────────
type TxFilter = 'ALL' | 'TAP_IN' | 'TOP_UP' | 'REFUND';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const DEMO_PAYMENT_METHODS = [
  { id: 'pm_1', type: 'Visa', last4: '4242', expiry: '12/26' },
  { id: 'pm_2', type: 'Mastercard', last4: '8891', expiry: '09/25' },
];

const TX_TYPE_LABELS: Record<string, string> = {
  TAP_IN: 'Bus Fare',
  TOP_UP: 'Top Up',
  REFUND: 'Refund',
  REVERSAL: 'Reversal',
  OVERRIDE: 'Override',
  ADJUSTMENT: 'Adjustment',
};

const FILTERS: { key: TxFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'TAP_IN', label: 'Trips' },
  { key: 'TOP_UP', label: 'Top-Ups' },
  { key: 'REFUND', label: 'Refunds' },
];

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W - 48;
const CARD_H = CARD_W / 1.586;

// ── Screen ───────────────────────────────────────────────────────────────────
export default function SmartCardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [filter, setFilter]     = useState<TxFilter>('ALL');
  const [qrVisible, setQrVisible] = useState(false);
  const [qrToken, setQrToken]   = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount]     = useState('');
  const [selectedPM, setSelectedPM]         = useState('pm_1');
  const [topUpState, setTopUpState]         = useState<'idle' | 'processing' | 'success'>('idle');

  // Animations
  const cardAnim    = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1, tension: 55, friction: 13, useNativeDriver: true,
    }).start();
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: balance } = useQuery({
    queryKey: ['smartcard', 'balance'],
    queryFn: async () => (await api.get('/smartcard/balance')).data.data,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['smartcard', 'transactions', filter],
    queryFn: async () =>
      (await api.get('/smartcard/transactions', {
        params: filter !== 'ALL' ? { type: filter } : {},
      })).data.data,
  });

  const generateQRMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/smartcard/qr/generate', { fareType: 'STANDARD' })).data.data,
    onSuccess: async (data) => {
      await saveQRTicket(data.token, data.expiresAt);
      setQrToken(data.token);
      setQrVisible(true);
      queryClient.invalidateQueries({ queryKey: ['smartcard'] });
    },
    onError: () => Alert.alert('Error', 'Failed to generate QR ticket'),
  });

  const showStoredQR = async () => {
    const stored = await getQRTicket();
    if (stored) {
      setQrToken(stored.token);
      setQrVisible(true);
    } else {
      generateQRMutation.mutate();
    }
  };

  // ── Top Up ─────────────────────────────────────────────────────────────────
  const effectiveAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount ?? 0;

  const handleTopUp = useCallback(async () => {
    if (effectiveAmount < 100) {
      Alert.alert('Minimum $100 JMD required');
      return;
    }
    setTopUpState('processing');
    try {
      await api.post('/smartcard/topup', { amountJMD: effectiveAmount });
      queryClient.invalidateQueries({ queryKey: ['smartcard'] });
      setTopUpState('success');
      Animated.spring(successAnim, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true }).start();
      setTimeout(() => {
        setTopUpState('idle');
        successAnim.setValue(0);
      }, 2800);
    } catch {
      setTopUpState('idle');
      Alert.alert('Top-up failed', 'Please try again');
    }
  }, [effectiveAmount]);

  // ── List header ────────────────────────────────────────────────────────────
  const firstName = user?.name?.split(' ')[0]?.toUpperCase() ?? 'COMMUTER';
  const lastFour  = balance?.cardNumber?.slice(-4) ?? '····';
  const currentBalance = balance?.balanceJMD ?? 0;
  const lastSynced = balance
    ? new Date(balance.lastSyncAt).toLocaleString('en-JM', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const listHeader = React.useMemo(() => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Premium Card ───────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardAnim,
            transform: [
              { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
            ],
          },
        ]}
      >
        {/* Surface sheen layer */}
        <View style={styles.cardSheen} />

        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardBrandJutc}>JUTC</Text>
          <Text style={styles.cardBrandSf}>SmartFare</Text>
          {/* Contactless rings */}
          <View style={styles.nfcContainer}>
            <View style={[styles.nfcRing, { width: 22, height: 22, borderRadius: 11 }]} />
            <View style={[styles.nfcRing, { width: 15, height: 15, borderRadius: 7.5 }]} />
            <View style={[styles.nfcRing, { width: 8, height: 8, borderRadius: 4 }]} />
          </View>
        </View>

        {/* Balance */}
        <View style={styles.cardBalanceArea}>
          <Text style={styles.cardBalanceLabel}>Available Balance</Text>
          <Text style={styles.cardBalanceAmount}>{formatJMD(currentBalance)}</Text>

          {/* Active status */}
          <View style={styles.cardStatusRow}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
            <Text style={styles.syncText}>Synced {lastSynced}</Text>
          </View>
        </View>

        {/* Card footer */}
        <View style={styles.cardFooter}>
          {/* EMV Chip */}
          <View style={styles.emvChip}>
            <View style={styles.emvChipLine} />
            <View style={styles.emvChipLineH} />
          </View>
          <View style={styles.cardFooterInfo}>
            <Text style={styles.cardNumber}>···· ···· ···· {lastFour}</Text>
            <Text style={styles.cardHolder}>{firstName}</Text>
          </View>
          <Text style={styles.cardExpiry}>06/28</Text>
        </View>

        {/* Success overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.successOverlay,
            {
              opacity: successAnim,
              transform: [{ scale: successAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.88, 1.02, 1] }) }],
            },
          ]}
        >
          <View style={styles.successBadge}>
            <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.successText}>+{formatJMD(effectiveAmount)} added</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={showStoredQR}
          activeOpacity={0.75}
        >
          {generateQRMutation.isPending
            ? <ActivityIndicator size="small" color={Colors.text} />
            : <Text style={styles.quickBtnText}>Show QR Ticket</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => Alert.alert('Card Settings', 'Coming soon')}
          activeOpacity={0.75}
        >
          <Text style={styles.quickBtnText}>Card Settings</Text>
        </TouchableOpacity>
      </View>

      {/* ── Top Up Section ──────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Add Funds</Text>

        {/* Preset amounts */}
        <View style={styles.presetGrid}>
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = selectedAmount === amt && !customAmount;
            return (
              <TouchableOpacity
                key={amt}
                style={[styles.presetPill, isSelected && styles.presetPillActive]}
                onPress={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.presetAmt, isSelected && styles.presetAmtActive]}>
                  ${amt.toLocaleString()}
                </Text>
                <Text style={[styles.presetCurrency, isSelected && styles.presetCurrencyActive]}>
                  JMD
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom amount */}
        <View style={[styles.customInputWrap, customAmount.length > 0 && styles.customInputWrapActive]}>
          <Text style={styles.customPrefix}>$</Text>
          <TextInput
            style={styles.customInput}
            value={customAmount}
            onChangeText={(v) => {
              setCustomAmount(v.replace(/[^0-9]/g, ''));
              if (v) setSelectedAmount(null);
            }}
            placeholder="Custom amount"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <Text style={styles.customSuffix}>JMD</Text>
        </View>
      </View>

      {/* ── Payment Methods ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pay with</Text>

        {DEMO_PAYMENT_METHODS.map((pm) => (
          <TouchableOpacity
            key={pm.id}
            style={[styles.pmRow, selectedPM === pm.id && styles.pmRowActive]}
            onPress={() => setSelectedPM(pm.id)}
            activeOpacity={0.75}
          >
            <View style={styles.pmTypeBox}>
              <Text style={styles.pmTypeText}>{pm.type.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.pmInfo}>
              <Text style={styles.pmName}>{pm.type}</Text>
              <Text style={styles.pmDetail}>···· {pm.last4}  ·  Exp {pm.expiry}</Text>
            </View>
            <View style={[styles.radio, selectedPM === pm.id && styles.radioActive]}>
              {selectedPM === pm.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addCardRow}
          onPress={() => Alert.alert('Add Card', 'Coming soon')}
          activeOpacity={0.7}
        >
          <Text style={styles.addCardText}>+ Add payment method</Text>
        </TouchableOpacity>
      </View>

      {/* ── Top Up Button ───────────────────────────────────────────────── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.ctaBtn, topUpState === 'processing' && styles.ctaBtnDisabled]}
          onPress={handleTopUp}
          activeOpacity={0.88}
          disabled={topUpState !== 'idle'}
        >
          {topUpState === 'processing' ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : topUpState === 'success' ? (
            <View style={styles.ctaSuccessRow}>
              <Check size={16} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.ctaBtnText}>Balance Updated</Text>
            </View>
          ) : (
            <Text style={styles.ctaBtnText}>
              Top Up {effectiveAmount > 0 ? formatJMD(effectiveAmount) : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Transaction History Header ──────────────────────────────────── */}
      <View style={styles.txHeader}>
        <Text style={styles.sectionLabel}>Recent Activity</Text>
        <View style={styles.filterRow}>
          {FILTERS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterTab, filter === key && styles.filterTabActive]}
              onPress={() => setFilter(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {txLoading && (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 32, marginBottom: 16 }} />
      )}
    </KeyboardAvoidingView>
  ), [
    cardAnim, successAnim, currentBalance, lastFour, lastSynced, firstName,
    selectedAmount, customAmount, selectedPM, topUpState, effectiveAmount,
    filter, txLoading, generateQRMutation.isPending,
    handleTopUp, showStoredQR,
  ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBack}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navBackText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>SmartFare Wallet</Text>
        <TouchableOpacity
          style={styles.navHelp}
          onPress={() => Alert.alert('Help', 'Contact JUTC support at 1-888-JUTC')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <HelpCircle size={18} color={Colors.textMuted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Main list */}
      <FlatList
        data={transactions ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item, index }) => <TransactionRow tx={item} index={index} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          txLoading ? null : (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )
        }
      />

      {/* QR Modal */}
      <Modal visible={qrVisible} transparent animationType="slide" onRequestClose={() => setQrVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>QR Backup Ticket</Text>
                <Text style={styles.modalSub}>Show to conductor if card unavailable</Text>
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setQrVisible(false)}
                activeOpacity={0.7}
              >
                <X size={17} color={Colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            {qrToken && (
              <View style={styles.qrWrap}>
                <QRCode value={qrToken} size={200} color={Colors.black} backgroundColor={Colors.white} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Transaction Row ──────────────────────────────────────────────────────────
const TransactionRow = memo(function TransactionRow({ tx, index }: { tx: any; index: number }) {
  const isCredit = tx.type === 'TOP_UP' || tx.type === 'REFUND';
  return (
    <View style={[styles.txRow, index === 0 && styles.txRowFirst]}>
      <View style={[styles.txIcon, isCredit ? styles.txIconCredit : styles.txIconDebit]}>
        {isCredit
          ? <ArrowDownLeft size={15} color={Colors.success} strokeWidth={2} />
          : <ArrowUpRight size={15} color={Colors.textMuted} strokeWidth={2} />
        }
      </View>
      <View style={styles.txDetails}>
        <Text style={styles.txType}>{TX_TYPE_LABELS[tx.type] ?? tx.type}</Text>
        <Text style={styles.txDate}>
          {new Date(tx.createdAt).toLocaleDateString('en-JM', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </Text>
      </View>
      <Text style={[styles.txAmount, isCredit ? styles.txCredit : styles.txDebit]}>
        {isCredit ? '+' : '\u2212'}{formatJMD(Number(tx.amountJMD))}
      </Text>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8F9FB',
  },
  navBack: {
    width: 32,
  },
  navBackText: {
    fontSize: 28,
    color: Colors.text,
    lineHeight: 32,
    fontWeight: '300',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  navHelp: {
    width: 32,
    alignItems: 'flex-end',
  },

  // Card
  card: {
    width: CARD_W,
    height: CARD_H,
    alignSelf: 'center',
    backgroundColor: '#1B1F24',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#1B1F24',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrandJutc: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  cardBrandSf: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginLeft: 10,
  },
  nfcContainer: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Card balance
  cardBalanceArea: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  cardBalanceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
    marginBottom: 6,
  },
  cardBalanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D9A6A',
  },
  activeText: {
    fontSize: 11,
    color: '#2D9A6A',
    fontWeight: '600',
  },
  syncText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    marginLeft: 4,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emvChip: {
    width: 30,
    height: 22,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emvChipLine: {
    position: 'absolute',
    width: '76%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emvChipLineH: {
    position: 'absolute',
    height: '72%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardFooterInfo: {
    flex: 1,
    gap: 3,
  },
  cardNumber: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  cardHolder: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  cardExpiry: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },

  // Success overlay on card
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,31,36,0.7)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2D9A6A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  successText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Preset amounts
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  presetPill: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  presetPillActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBEB',
  },
  presetAmt: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  presetAmtActive: {
    color: '#1B1F24',
  },
  presetCurrency: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
  },
  presetCurrencyActive: {
    color: Colors.primary,
  },

  // Custom input
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  customInputWrapActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBEB',
  },
  customPrefix: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  customInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    padding: 0,
  },
  customSuffix: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },

  // Payment methods
  pmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pmRowActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBEB',
  },
  pmTypeBox: {
    width: 40,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  pmInfo: {
    flex: 1,
    gap: 3,
  },
  pmName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  pmDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  addCardRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  ctaBtn: {
    backgroundColor: Colors.black,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B1F24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 56,
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  ctaSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Transaction history
  txHeader: {
    paddingHorizontal: 24,
    marginBottom: 8,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  filterText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Transaction rows
  listContent: {
    paddingTop: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  txRowFirst: {
    borderTopWidth: 0,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconCredit: {
    backgroundColor: 'rgba(45,154,106,0.1)',
  },
  txIconDebit: {
    backgroundColor: Colors.surface,
  },
  txDetails: {
    flex: 1,
    gap: 3,
  },
  txType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  txDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  txCredit: {
    color: Colors.success,
  },
  txDebit: {
    color: Colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 14,
    paddingTop: 40,
    paddingBottom: 20,
  },

  // QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    alignItems: 'center',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 22,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrap: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
