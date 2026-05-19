import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { Colors } from '../../constants/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Notification = {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  body: string;
  createdAt: string;
};

type ReportCategory = 'Delay' | 'Overcrowding' | 'Safety' | 'Traffic';

type CommunityReport = {
  id: string;
  category: ReportCategory;
  routeCode: string | null;
  description: string;
  timeAgo: string;
  helpful: number;
};

type ActiveTab = 'alerts' | 'community';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  INFO:     { color: Colors.primary,  label: 'Info' },
  WARNING:  { color: Colors.warning,  label: 'Warning' },
  CRITICAL: { color: Colors.critical, label: 'Alert' },
};

const CATEGORY_DOT: Record<ReportCategory, string> = {
  Delay:       Colors.warning,
  Overcrowding: Colors.critical,
  Traffic:     '#6366F1',
  Safety:      '#F59E0B',
};

const CATEGORIES: ReportCategory[] = ['Delay', 'Overcrowding', 'Safety', 'Traffic'];

const DEMO_REPORTS: CommunityReport[] = [
  {
    id: 'r1',
    category: 'Delay',
    routeCode: '22',
    description: 'Bus very late at Half Way Tree. Been waiting 25 minutes.',
    timeAgo: '2 min ago',
    helpful: 4,
  },
  {
    id: 'r2',
    category: 'Overcrowding',
    routeCode: '45',
    description: 'Route 45 packed at Papine. Standing room only.',
    timeAgo: '12 min ago',
    helpful: 7,
  },
  {
    id: 'r3',
    category: 'Traffic',
    routeCode: null,
    description: 'Heavy traffic on Washington Blvd slowing all buses.',
    timeAgo: '18 min ago',
    helpful: 11,
  },
  {
    id: 'r4',
    category: 'Safety',
    routeCode: '35',
    description: 'Stop at Ferry poorly lit at night. Needs attention.',
    timeAgo: '45 min ago',
    helpful: 3,
  },
];

// ---------------------------------------------------------------------------
// Alert card
// ---------------------------------------------------------------------------

function AlertCard({
  item,
  expanded,
  onToggle,
}: {
  item: Notification;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.INFO;
  const time = new Date(item.createdAt).toLocaleString('en-JM', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onToggle}
      style={[styles.card, { borderLeftColor: config.color }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.severityPill, { backgroundColor: `${config.color}18` }]}>
          <View style={[styles.dot6, { backgroundColor: config.color }]} />
          <Text style={[styles.severityLabel, { color: config.color }]}>{config.label}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.cardTime}>{time}</Text>
          <Text style={[styles.chevron, expanded && styles.chevronUp]}>›</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>

      {expanded && (
        <>
          <Text style={styles.cardBody}>{item.body}</Text>
          <Text style={styles.cardType}>{item.type.replace(/_/g, ' ').toLowerCase()}</Text>
          <View style={styles.replyStub}>
            <Text style={styles.replyStubText}>Community replies coming soon</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Community report card
// ---------------------------------------------------------------------------

function ReportCard({
  item,
  onHelpful,
}: {
  item: CommunityReport;
  onHelpful: (id: string) => void;
}) {
  const dotColor = CATEGORY_DOT[item.category];

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportCardHeader}>
        <View style={styles.reportMeta}>
          <View style={[styles.dot8, { backgroundColor: dotColor }]} />
          <Text style={styles.reportCategory}>{item.category}</Text>
          {item.routeCode && (
            <View style={styles.routeBadge}>
              <Text style={styles.routeBadgeText}>Route {item.routeCode}</Text>
            </View>
          )}
        </View>
        <Text style={styles.reportTime}>{item.timeAgo}</Text>
      </View>

      <Text style={styles.reportDescription}>{item.description}</Text>

      <View style={styles.reportFooter}>
        <Text style={styles.reportReporter}>Passenger</Text>
        <TouchableOpacity
          style={styles.helpfulBtn}
          onPress={() => onHelpful(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.thumbIcon}>👍</Text>
          <Text style={styles.helpfulCount}>{item.helpful}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Report Incident Modal
// ---------------------------------------------------------------------------

function ReportModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (report: Omit<CommunityReport, 'id' | 'timeAgo' | 'helpful'>) => void;
}) {
  const [category, setCategory] = useState<ReportCategory>('Delay');
  const [description, setDescription] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const insets = useSafeAreaInsets();

  const handleSubmit = useCallback(() => {
    if (!description.trim()) return;
    onSubmit({ category, description: description.trim(), routeCode: routeCode.trim() || null });
    setDescription('');
    setRouteCode('');
    setCategory('Delay');
  }, [category, description, routeCode, onSubmit]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report an Incident</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Category pills */}
          <Text style={styles.modalLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, category === cat && styles.catPillActive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.75}
              >
                <View style={[styles.dot6, { backgroundColor: CATEGORY_DOT[cat] }]} />
                <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.modalLabel}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what you're seeing..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Route */}
          <Text style={styles.modalLabel}>Route number (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 22, 45, 35"
            placeholderTextColor={Colors.textMuted}
            value={routeCode}
            onChangeText={setRouteCode}
            keyboardType="default"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !description.trim() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!description.trim()}
          >
            <Text style={styles.submitBtnText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const queryClientRef = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>('alerts');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>(DEMO_REPORTS);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.data as Notification[],
    refetchInterval: 30_000,
  });

  // Real-time: receive admin-published alerts immediately via socket
  useEffect(() => {
    let mounted = true;
    getSocket().then((socket) => {
      if (!mounted) return;
      const handler = (payload: { notification: Notification }) => {
        queryClientRef.setQueryData<Notification[]>(['notifications'], (prev) => {
          if (!prev) return [payload.notification];
          // Avoid duplicate if poll also returns it
          if (prev.some((n) => n.id === payload.notification.id)) return prev;
          return [payload.notification, ...prev];
        });
      };
      socket.on('alert:service', handler);
      // Cleanup
      (socket as any).__cleanupAlertHandler = () => socket.off('alert:service', handler);
    });
    return () => {
      mounted = false;
      getSocket().then((socket) => (socket as any).__cleanupAlertHandler?.());
    };
  }, [queryClientRef]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleHelpful = useCallback((id: string) => {
    setCommunityReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r))
    );
  }, []);

  const handleSubmitReport = useCallback(
    (report: Omit<CommunityReport, 'id' | 'timeAgo' | 'helpful'>) => {
      const newReport: CommunityReport = {
        ...report,
        id: `r${Date.now()}`,
        timeAgo: 'just now',
        helpful: 0,
      };
      setCommunityReports((prev) => [newReport, ...prev]);
      setModalVisible(false);
    },
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Transit Hub</Text>
          <Text style={styles.headerSubtitle}>Live updates & community reports</Text>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Segment tabs                                                        */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
          onPress={() => setActiveTab('alerts')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
            System Alerts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.tabActive]}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
            Community
          </Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                             */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'alerts' ? (
        isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AlertCard
                item={item}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleExpand(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyAlerts />}
          />
        )
      ) : (
        <FlatList
          data={communityReports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReportCard item={item} onHelpful={handleHelpful} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to report an incident</Text>
            </View>
          }
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Floating report button                                              */}
      {/* ------------------------------------------------------------------ */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Report Incident</Text>
      </TouchableOpacity>

      {/* ------------------------------------------------------------------ */}
      {/* Report modal                                                        */}
      {/* ------------------------------------------------------------------ */}
      <ReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitReport}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyAlerts() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyCheckOuter}>
          <View style={styles.emptyCheckInner} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>All Clear</Text>
      <Text style={styles.emptySubtitle}>No active service alerts</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.black,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.white,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },

  // Alert card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 13,
    padding: 16,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  chevron: {
    fontSize: 16,
    color: Colors.textMuted,
    transform: [{ rotate: '90deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '-90deg' }],
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardType: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'capitalize',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  replyStub: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  replyStubText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Community report card
  reportCard: {
    backgroundColor: Colors.white,
    borderRadius: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  reportCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  routeBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  reportTime: {
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  reportDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportReporter: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbIcon: {
    fontSize: 13,
  },
  helpfulCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Shared dot primitives
  dot6: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dot8: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  catPillActive: {
    borderColor: Colors.black,
    backgroundColor: Colors.black,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  catPillTextActive: {
    color: Colors.white,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 20,
    backgroundColor: Colors.surface,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 72,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyCheckOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheckInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
