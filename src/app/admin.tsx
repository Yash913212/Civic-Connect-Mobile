import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppStore, Complaint } from '../store';
import { GlassCard } from '../components/GlassCard';


const { width: SW, height: SH } = Dimensions.get('window');

const C = {
  navy:       '#05101E',
  surface:    '#0D1B2E',
  elevated:   '#112236',
  gold:       '#C9A84C',
  goldDim:    'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.25)',
  amber:      '#F5A623',
  green:      '#2ECC8F',
  blue:       '#3D8EF0',
  danger:     '#EF4444',
  text:       '#FFFFFF',
  muted:      'rgba(255,255,255,0.40)',
  border:     'rgba(255,255,255,0.06)',
} as const;

function GlowingOrb({ color, startX, startY, delay }: { color: string; startX: number; startY: number; delay: number }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(40, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: color,
          opacity: 0.08,
          left: startX,
          top: startY,
        },
        style,
      ]}
    />
  );
}

export default function AdminPortalScreen() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const updateComplaintStatus = useAppStore((s) => s.updateComplaintStatus);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'assigned' | 'in_progress' | 'resolved'>('all');
  const [activeTab, setActiveTab] = useState<'queue' | 'officers'>('queue');
  
  const [targetComp, setTargetComp] = useState<Complaint | null>(null);
  const [officerName, setOfficerName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isModalFocused, setIsModalFocused] = useState(false);


  const stats = {
    total: complaints.length,
    active: complaints.filter(c => ['assigned', 'in_progress', 'pending'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    critical: complaints.filter(c => c.priority === 'critical' || c.priority === 'high').length
  };

  const filteredComplaints = complaints.filter(c => {
    if (selectedFilter === 'all') return true;
    return c.status === selectedFilter;
  });

  const officers = [
    { name: 'Ramesh Babu', department: 'Roads Department', active: 3, resolved: 14, performance: '98%' },
    { name: 'Madan Gopal', department: 'Sanitation', active: 2, resolved: 22, performance: '94%' },
    { name: 'Nagesh Rao', department: 'Electricity', active: 1, resolved: 18, performance: '91%' },
    { name: 'K. Srinivasan', department: 'Water Works', active: 4, resolved: 11, performance: '89%' }
  ];

  const handleAssign = () => {
    if (targetComp && officerName.trim()) {
      updateComplaintStatus(targetComp.id, 'assigned', officerName);
      setTargetComp(null);
      setOfficerName('');
      setShowModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return C.green;
      case 'in_progress': return C.gold;
      case 'assigned': return C.blue;
      default: return C.muted;
    }
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#05101E', '#091a35', '#030c18']}
        style={StyleSheet.absoluteFill}
      />
      <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.15} delay={0} />
      <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={{ fontSize: 20, color: C.text, fontFamily: 'Sora_700Bold' }}>←</Text>
          </Pressable>
          <View>
            <Text style={s.title}>MUNICIPAL CONTROL</Text>
            <Text style={s.subtitle}>Officer Command Dashboard</Text>
          </View>
          <View style={s.badge}>
            <View style={s.pulseDot} />
            <Text style={s.badgeText}>LIVE FEED</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Dashboard Summary Cards */}
          <View style={s.metricsRow}>
            <GlassCard
              style={s.metricCard}
              borderColor="rgba(255,255,255,0.08)"
              delay={50}
              padding={16}
            >
              <Text style={s.metricLabel}>Total Grievances</Text>
              <Text style={s.metricVal}>{stats.total}</Text>
            </GlassCard>
            <GlassCard
              style={s.metricCard}
              borderColor="rgba(245, 166, 35, 0.25)"
              glowColor="rgba(245, 166, 35, 0.08)"
              delay={100}
              padding={16}
            >
              <Text style={[s.metricLabel, { color: C.amber }]}>Active Cases</Text>
              <Text style={s.metricVal}>{stats.active}</Text>
            </GlassCard>
            <GlassCard
              style={s.metricCard}
              borderColor="rgba(46, 204, 143, 0.25)"
              glowColor="rgba(46, 204, 143, 0.08)"
              delay={150}
              padding={16}
            >
              <Text style={[s.metricLabel, { color: C.green }]}>Resolved</Text>
              <Text style={s.metricVal}>{stats.resolved}</Text>
            </GlassCard>
            <GlassCard
              style={s.metricCard}
              borderColor="rgba(239, 68, 68, 0.25)"
              glowColor="rgba(239, 68, 68, 0.08)"
              delay={200}
              padding={16}
            >
              <Text style={[s.metricLabel, { color: C.danger }]}>Critical Alerts</Text>
              <Text style={s.metricVal}>{stats.critical}</Text>
            </GlassCard>
          </View>


          {/* Tab Switcher */}
          <View style={s.tabContainer}>
            <Pressable onPress={() => setActiveTab('queue')} style={[s.tab, activeTab === 'queue' && s.tabActive]}>
              <Text style={[s.tabText, activeTab === 'queue' && s.tabTextActive]}>Complaint Queue</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('officers')} style={[s.tab, activeTab === 'officers' && s.tabActive]}>
              <Text style={[s.tabText, activeTab === 'officers' && s.tabTextActive]}>Officer Dispatcher</Text>
            </Pressable>
          </View>

          {activeTab === 'queue' ? (
            <>
              {/* Queue Filters */}
              <View style={{ height: 48, marginBottom: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {['all', 'pending', 'assigned', 'in_progress', 'resolved'].map((f) => (
                    <Pressable key={f} onPress={() => setSelectedFilter(f as any)} style={[s.filterBtn, selectedFilter === f && s.filterBtnActive]}>
                      <Text style={[s.filterText, selectedFilter === f && s.filterTextActive]}>{f.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Complaints List Queue */}
              <View style={s.queueList}>
                {filteredComplaints.length === 0 ? (
                  <Text style={s.empty}>No grievances matched target filters</Text>
                ) : (
                  filteredComplaints.map((c, index) => (
                    <GlassCard
                      key={c.id}
                      style={s.compCard}
                      borderColor={c.status === 'resolved' ? 'rgba(46,204,143,0.22)' : 'rgba(255,255,255,0.08)'}
                      glowColor={c.status === 'resolved' ? 'rgba(46,204,143,0.08)' : undefined}
                      delay={index * 50}
                      padding={18}
                    >
                      <View style={s.cardHead}>
                        <Text style={s.compId}>{c.id}</Text>
                        <View style={[s.statusTag, { borderColor: getStatusColor(c.status) }]}>
                          <Text style={[s.statusTagText, { color: getStatusColor(c.status) }]}>{c.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      
                      <Text style={s.compTitle}>{c.description || 'Civic Ingest report'}</Text>
                      <Text style={s.compLoc}>📍 {c.location}</Text>
                      
                      <View style={s.metadataRow}>
                        <View style={s.metaTag}>
                          <Text style={s.metaTagText}>💼 {c.department || 'Pending Router'}</Text>
                        </View>
                        <View style={[s.metaTag, (c.priority === 'high' || c.priority === 'critical') && { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                          <Text style={[s.metaTagText, (c.priority === 'high' || c.priority === 'critical') && { color: C.danger }]}>⚡ {c.priority.toUpperCase()}</Text>
                        </View>
                      </View>

                      {c.officerName ? (
                        <View style={s.assignedRow}>
                          <Text style={s.assignedLabel}>Assigned: <Text style={{ color: C.text, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>{c.officerName}</Text></Text>
                          <Pressable onPress={() => updateComplaintStatus(c.id, 'resolved')} style={s.resolveBtn}>
                            <Text style={s.resolveBtnText}>RESOLVE</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => { setTargetComp(c); setShowModal(true); }} style={s.dispatchBtn}>
                          <Text style={s.dispatchBtnText}>⚡ DEPLOY FIELD OFFICER</Text>
                        </Pressable>
                      )}
                    </GlassCard>
                  ))
                )}
              </View>

            </>
          ) : (
            /* Officers List Board */
            <View style={s.officersList}>
              {officers.map((o, index) => (
                <GlassCard
                  key={o.name}
                  style={s.officerCard}
                  borderColor="rgba(255,255,255,0.08)"
                  delay={index * 50}
                  padding={18}
                >
                  <View style={s.officerHeader}>
                    <View style={s.officerMeta}>
                      <Text style={s.officerName}>{o.name}</Text>
                      <Text style={s.officerDept}>{o.department}</Text>
                    </View>
                    <Text style={s.perf}>{o.performance}</Text>
                  </View>
                  <View style={s.officerStats}>
                    <View>
                      <Text style={s.statLbl}>ACTIVE CASES</Text>
                      <Text style={s.statNum}>{o.active}</Text>
                    </View>
                    <View>
                      <Text style={s.statLbl}>RESOLVED TOTAL</Text>
                      <Text style={[s.statNum, { color: C.green }]}>{o.resolved}</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>

          )}
        </ScrollView>

        {/* Dispatch Modal Dialog */}
        <Modal visible={showModal} animationType="fade" transparent>
          <View style={s.modalOverlay}>
            <GlassCard
              style={s.modalCard}
              borderColor="rgba(201,168,76,0.3)"
              glowColor="rgba(201,168,76,0.08)"
              delay={0}
              padding={24}
            >
              <Text style={s.modalTitle}>Deploy Officer</Text>
              <Text style={s.modalSub}>Select field officer to deploy for complaint {targetComp?.id}</Text>

              <TextInput 
                style={[
                  s.input,
                  isModalFocused && { borderColor: 'rgba(201,168,76,0.25)', backgroundColor: 'rgba(201,168,76,0.04)' }
                ]} 
                placeholder="Enter Officer Name (e.g. Ramesh Babu)" 
                placeholderTextColor={C.muted}
                value={officerName}
                onChangeText={setOfficerName}
                onFocus={() => setIsModalFocused(true)}
                onBlur={() => setIsModalFocused(false)}
              />

              <View style={s.modalActions}>
                <Pressable onPress={() => setShowModal(false)} style={s.cancelBtn}>
                  <Text style={s.cancelBtnText}>CANCEL</Text>
                </Pressable>
                <Pressable onPress={handleAssign} style={s.confirmBtn}>
                  <Text style={s.confirmBtnText}>DEPLOY</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border
  },
  title: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: 1.5, fontFamily: 'Sora_800ExtraBold' },
  subtitle: { fontSize: 11, color: C.gold, textTransform: 'uppercase', marginTop: 2, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger },
  badgeText: { fontSize: 9, fontWeight: '700', color: C.danger, letterSpacing: 0.5, fontFamily: 'Sora_700Bold' },
  scroll: { padding: 20, gap: 20 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: (SW - 40 - 10) / 2,
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    gap: 4
  },
  metricLabel: { fontSize: 10, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Sora_600SemiBold' },
  metricVal: { fontSize: 24, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8
  },

  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: C.goldBorder },
  tabText: { fontSize: 13, color: C.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  tabTextActive: { color: C.gold, fontWeight: '700', fontFamily: 'Sora_700Bold' },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: C.border,
    height: 38,
    justifyContent: 'center'
  },
  filterBtnActive: { backgroundColor: C.gold, borderColor: C.gold },
  filterText: { fontSize: 11, fontWeight: '700', color: C.muted, fontFamily: 'Sora_600SemiBold' },
  filterTextActive: { color: C.navy, fontFamily: 'Sora_700Bold' },

  queueList: { gap: 12 },
  compCard: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    gap: 12
  },

  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compId: { fontSize: 12, fontWeight: '800', color: C.gold, fontFamily: 'Sora_800ExtraBold' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusTagText: { fontSize: 9, fontWeight: '700', fontFamily: 'Sora_700Bold' },
  compTitle: { fontSize: 15, fontWeight: '700', color: C.text, fontFamily: 'Sora_700Bold' },
  compLoc: { fontSize: 12, color: C.muted, fontFamily: 'Sora_400Regular' },
  metadataRow: { flexDirection: 'row', gap: 8 },
  metaTag: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  metaTagText: { fontSize: 11, color: C.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  dispatchBtn: {
    backgroundColor: C.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  dispatchBtnText: { color: C.navy, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'Sora_700Bold' },
  assignedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: C.border, paddingTop: 12, marginTop: 4 },
  assignedLabel: { fontSize: 12, color: C.muted, fontFamily: 'Sora_400Regular' },
  resolveBtn: { backgroundColor: C.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  resolveBtnText: { color: C.navy, fontSize: 11, fontWeight: '800', fontFamily: 'Sora_700Bold' },
  officersList: { gap: 12 },
  officerCard: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    gap: 14
  },

  officerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  officerMeta: { gap: 2 },
  officerName: { fontSize: 16, fontWeight: '700', color: C.text, fontFamily: 'Sora_700Bold' },
  officerDept: { fontSize: 12, color: C.muted, fontFamily: 'Sora_400Regular' },
  perf: { fontSize: 14, fontWeight: '800', color: C.green, fontFamily: 'Sora_800ExtraBold' },
  officerStats: { flexDirection: 'row', gap: 32 },
  statLbl: { fontSize: 9, color: C.muted, fontWeight: '700', fontFamily: 'Sora_700Bold', letterSpacing: 0.5 },
  statNum: { fontSize: 18, fontWeight: '800', color: C.text, marginTop: 2, fontFamily: 'Sora_800ExtraBold' },
  empty: { textAlign: 'center', color: C.muted, fontSize: 14, marginVertical: 32, fontFamily: 'Sora_400Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 24,
    backgroundColor: 'transparent',
    gap: 16
  },

  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  modalSub: { fontSize: 13, color: C.muted, fontFamily: 'Sora_400Regular' },
  input: {
    backgroundColor: 'rgba(17,34,54,0.6)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    color: C.text,
    fontSize: 14,
    fontFamily: 'Sora_400Regular'
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.02)' },
  cancelBtnText: { color: C.text, fontSize: 13, fontWeight: '700', fontFamily: 'Sora_600SemiBold' },
  confirmBtn: {
    flex: 1,
    backgroundColor: C.gold,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  confirmBtnText: { color: C.navy, fontSize: 13, fontWeight: '700', fontFamily: 'Sora_700Bold' }
});
