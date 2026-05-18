import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { formatJMD } from '../constants/currency';

const CARD_WIDTH = Dimensions.get('window').width - 32;

interface Props {
  balanceJMD: number;
  cardNumber?: string;
  onTopUp: () => void;
}

export const SmartFareCard = memo(function SmartFareCard({ balanceJMD, cardNumber, onTopUp }: Props) {
  const lastFour = cardNumber ? cardNumber.slice(-4) : '····';
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enterAnim,
          transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      {/* Subtle top-surface sheen */}
      <View style={styles.sheen} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.brandJutc}>JUTC</Text>
        <Text style={styles.brandSmartfare}>SmartFare</Text>
        {/* NFC rings */}
        <View style={styles.nfcWrap}>
          <View style={[styles.nfcRing, { width: 18, height: 18, borderRadius: 9 }]} />
          <View style={[styles.nfcRing, { width: 12, height: 12, borderRadius: 6 }]} />
          <View style={[styles.nfcRing, { width: 6, height: 6, borderRadius: 3 }]} />
        </View>
      </View>

      {/* Balance */}
      <View style={styles.balanceArea}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{formatJMD(balanceJMD)}</Text>
      </View>

      {/* Footer row */}
      <View style={styles.footerRow}>
        {/* Chip */}
        <View style={styles.chip}>
          <View style={styles.chipLine} />
          <View style={styles.chipLineH} />
        </View>
        <Text style={styles.cardNum}>···· ···· ···· {lastFour}</Text>
        <TouchableOpacity style={styles.topUpBtn} onPress={onTopUp} activeOpacity={0.85}>
          <Text style={styles.topUpText}>Top Up</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1B1F24',
    borderRadius: 18,
    padding: 20,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandJutc: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  brandSmartfare: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  nfcWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
  },
  nfcRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  balanceArea: {
    marginBottom: 22,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    width: 26,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLine: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    top: '35%',
  },
  chipLineH: {
    position: 'absolute',
    height: '70%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardNum: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.8,
    fontVariant: ['tabular-nums'],
  },
  topUpBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topUpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B1F24',
    letterSpacing: 0.2,
  },
});
