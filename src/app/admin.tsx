import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore, Complaint } from '../store';
import { GlassCard } from '../components/GlassCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import Svg, { Path, Circle, Line, Defs, Stop, Text as SvgText, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { generateInsights, generateOfficerResponse } from '../services/ai';

const { width: SW, height: SH } = Dimensions.get('window');

export default function AdminPortalScreen() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const updateComplaintStatus = useAppStore((s) => s.updateComplaintStatus);
  const user = useAppStore((s) => s.user);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'assigned' | 'in_progress' | 'resolved'>('all');
  const [activeTab, setActiveTab] = useState<'queue' | 'officers' | 'insights'>('queue');

  const [targetComp, setTargetComp] = useState<Complaint | null>(null);
  const [officerName, setOfficerName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isModalFocused, setIsModalFocused] = useState(false);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [aiInsights, setAiInsights] = useState<{ summary: string; trends: string; recommendations: string[] } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [generatingReply, setGeneratingReply] = useState(false);
  const [chats, setChats] = useState([
    {
      id: 'chat-1',
      userName: 'Suresh Kumar',
      issue: 'Pothole in Sector 4',
      messages: [
        { sender: 'user', text: 'Hi, there is a very deep pothole near the main crossing of Sector 4. It is causing traffic jams.', time: '10:30 AM' },
        { sender: 'bot', text: 'I have logged this pothole complaint. It has been routed to the Roads Department.', time: '10:31 AM' },
        { sender: 'user', text: 'Thanks. Can you tell me when someone will come to fix it?', time: '10:32 AM' },
      ],
    },
    {
      id: 'chat-2',
      userName: 'Priya Sharma',
      issue: 'Water Supply Outage',
      messages: [
        { sender: 'user', text: 'No water supply since morning in Sector 7. Is there a maintenance going on?', time: '10:15 AM' },
        { sender: 'bot', text: 'Yes, water department reports pipeline maintenance in Sector 7 until 4 PM.', time: '10:16 AM' },
      ],
    },
    {
      id: 'chat-3',
      userName: 'Anil Reddy',
      issue: 'Streetlight Blown Out',
      messages: [
        { sender: 'user', text: 'The streetlight outside plot 45 is completely dead. It is very dark and unsafe.', time: '09:45 AM' },
        { sender: 'bot', text: 'Logged under Electrical Department. Verification code: CIV-892.', time: '09:46 AM' },
      ],
    },
  ]);

  const handleSendAdminReply = () => {
    if (adminReplyText.trim() && selectedChatId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === selectedChatId) {
            return {
              ...c,
              messages: [
                ...c.messages,
                { sender: 'admin', text: adminReplyText.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ],
            };
          }
          return c;
        })
      );
      setAdminReplyText('');
    }
  };

  const handleAiSuggestReply = async () => {
    const chat = chats.find((c) => c.id === selectedChatId);
    if (!chat) return;
    setGeneratingReply(true);
    const lastUserMsg = [...chat.messages].reverse().find((m) => m.sender === 'user');
    const matchingComplaint = complaints.find(
      (c) => c.title.toLowerCase().includes(chat.issue.toLowerCase()) || chat.issue.toLowerCase().includes(c.title.toLowerCase())
    );
    const reply = await generateOfficerResponse(
      matchingComplaint || { title: chat.issue, description: lastUserMsg?.text || chat.issue, category: 'General', department: 'Municipal', priority: 'medium', id: '', imageUri: null, location: '', latitude: 0, longitude: 0, status: 'pending', confidence: 0, language: 'English', municipalNote: '', createdAt: '', officerName: '' }
    );
    setAdminReplyText(reply);
    setGeneratingReply(false);
  };

  if (user?.role !== 'Admin' && user?.role !== 'Officer') {
    return (
      <ScreenLayout>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <GlassCard borderColor="rgba(239, 68, 68, 0.3)" glowColor="rgba(239, 68, 68, 0.15)" padding={30} style={{ width: '100%', alignItems: 'center', gap: 20 }}>
            <Text style={{ fontSize: 50 }}>🔒</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', textAlign: 'center' }}>
              Access Restricted
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: 'Sora_400Regular', textAlign: 'center', lineHeight: 22 }}>
              This control center is reserved for municipal administrators and dispatch officers.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.blue,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                marginTop: 10,
                width: '100%',
                alignItems: 'center',
              }}
              accessibilityLabel="Go back"
            >
              <Text style={{ color: colors.text, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>Go Back</Text>
            </Pressable>
          </GlassCard>
        </View>
      </ScreenLayout>
    );
  }

  const stats = {
    total: complaints.length,
    active: complaints.filter((c) => ['assigned', 'in_progress', 'pending'].includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    critical: complaints.filter((c) => c.priority === 'critical' || c.priority === 'high').length,
  };

  const filteredComplaints = complaints.filter((c) => {
    if (selectedFilter === 'all') return true;
    return c.status === selectedFilter;
  });

  const officers = (() => {
    const map = new Map<string, { name: string; department: string; active: number; resolved: number }>();
    complaints.forEach((c) => {
      if (!c.officerName) return;
      if (!map.has(c.officerName)) {
        map.set(c.officerName, { name: c.officerName, department: c.department, active: 0, resolved: 0 });
      }
      const entry = map.get(c.officerName)!;
      if (c.status === 'resolved') entry.resolved++;
      else entry.active++;
    });
    return Array.from(map.values()).map((o) => ({
      ...o,
      performance: o.resolved + o.active > 0 ? Math.round((o.resolved / (o.resolved + o.active)) * 100) + '%' : '0%',
    }));
  })();

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
      case 'resolved': return colors.green;
      case 'in_progress': return colors.gold;
      case 'assigned': return colors.blue;
      default: return colors.muted;
    }
  };

  return (
    <ScreenLayout>
      <View style={s.header}>
        <BackButton />
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
        <View style={s.metricsRow}>
          <GlassCard style={s.metricCard} borderColor="rgba(255,255,255,0.08)" delay={50} padding={16}>
            <Text style={s.metricLabel}>Total Grievances</Text>
            <AnimatedCounter value={stats.total} delay={150} duration={1000} style={s.metricVal} />
          </GlassCard>
          <GlassCard style={s.metricCard} borderColor="rgba(245, 166, 35, 0.25)" glowColor="rgba(245, 166, 35, 0.08)" delay={100} padding={16}>
            <Text style={[s.metricLabel, { color: colors.amber }]}>Active Cases</Text>
            <AnimatedCounter value={stats.active} delay={250} duration={1000} style={[s.metricVal, { color: colors.amber }]} />
          </GlassCard>
          <GlassCard style={s.metricCard} borderColor="rgba(46, 204, 143, 0.25)" glowColor="rgba(46, 204, 143, 0.08)" delay={150} padding={16}>
            <Text style={[s.metricLabel, { color: colors.green }]}>Resolved</Text>
            <AnimatedCounter value={stats.resolved} delay={350} duration={1000} style={[s.metricVal, { color: colors.green }]} />
          </GlassCard>
          <GlassCard style={s.metricCard} borderColor="rgba(239, 68, 68, 0.25)" glowColor="rgba(239, 68, 68, 0.08)" delay={200} padding={16}>
            <Text style={[s.metricLabel, { color: colors.danger }]}>Critical Alerts</Text>
            <AnimatedCounter value={stats.critical} delay={450} duration={1000} style={[s.metricVal, { color: colors.danger }]} />
          </GlassCard>
        </View>

        <View style={s.tabContainer}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('queue'); }}
            style={[s.tab, activeTab === 'queue' && s.tabActive]}
            accessibilityLabel="Queue tab"
          >
            <Text style={[s.tabText, activeTab === 'queue' && s.tabTextActive]}>Queue</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('officers'); }}
            style={[s.tab, activeTab === 'officers' && s.tabActive]}
            accessibilityLabel="Officers tab"
          >
            <Text style={[s.tabText, activeTab === 'officers' && s.tabTextActive]}>Officers</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('insights'); }}
            style={[s.tab, activeTab === 'insights' && s.tabActive]}
            accessibilityLabel="Insights tab"
          >
            <Text style={[s.tabText, activeTab === 'insights' && s.tabTextActive]}>Insights</Text>
          </Pressable>
        </View>

        {activeTab === 'queue' ? (
          <>
            <View style={{ height: 48, marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['all', 'pending', 'assigned', 'in_progress', 'resolved'].map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedFilter(f as any); }}
                    style={[s.filterBtn, selectedFilter === f && s.filterBtnActive]}
                    accessibilityLabel={`Filter ${f}`}
                  >
                    <Text style={[s.filterText, selectedFilter === f && s.filterTextActive]}>{f.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

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
                        <Text style={[s.metaTagText, (c.priority === 'high' || c.priority === 'critical') && { color: colors.danger }]}>⚡ {c.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                    {c.officerName ? (
                      <View style={s.assignedRow}>
                        <Text style={s.assignedLabel}>Assigned: <Text style={{ color: colors.text, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>{c.officerName}</Text></Text>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            updateComplaintStatus(c.id, 'resolved');
                          }}
                          style={s.resolveBtn}
                          accessibilityLabel={`Resolve complaint ${c.id}`}
                        >
                          <Text style={s.resolveBtnText}>RESOLVE</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => { setTargetComp(c); setShowModal(true); }}
                        style={s.dispatchBtn}
                        accessibilityLabel={`Deploy officer for ${c.id}`}
                      >
                        <Text style={s.dispatchBtnText}>⚡ DEPLOY FIELD OFFICER</Text>
                      </Pressable>
                    )}
                  </GlassCard>
                ))
              )}
            </View>
          </>
        ) : activeTab === 'officers' ? (
          <View style={s.officersList}>
            {officers.map((o, index) => (
              <GlassCard key={o.name} style={s.officerCard} borderColor="rgba(255,255,255,0.08)" delay={index * 50} padding={18}>
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
                    <Text style={[s.statNum, { color: colors.green }]}>{o.resolved}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        ) : (
          <View style={s.insightsContainer}>
            <Text style={s.sectionTitle}>📊 Data Analytics</Text>
            <View style={{ gap: 16, marginBottom: 24 }}>
              <GlassCard borderColor="rgba(255,255,255,0.08)" glowColor="rgba(61,142,240,0.04)" padding={16} style={{ gap: 12 }}>
                <Text style={s.graphTitle}>Weekly Ingestion Load</Text>
                <Text style={s.graphSubtitle}>Daily complaints trend (Mon - Sun)</Text>
                <View style={{ height: 160, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Svg height="150" width={SW - 80} viewBox={`0 0 ${SW - 80} 150`}>
                    <Defs>
                      <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={colors.blue} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={colors.blue} stopOpacity="0.0" />
                      </SvgLinearGradient>
                    </Defs>
                    <Line x1="10" y1="20" x2={SW - 90} y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <Line x1="10" y1="60" x2={SW - 90} y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <Line x1="10" y1="100" x2={SW - 90} y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <Path
                      d={`M 30,120 Q 50,107 70,95 T 110,125 T 150,70 T 190,100 T 230,45 T 270,75`}
                      fill="none"
                      stroke={colors.blue}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <Path d={`M 30,120 Q 50,107 70,95 T 110,125 T 150,70 T 190,100 T 230,45 T 270,75 L 270,140 L 30,140 Z`} fill="url(#grad)" />
                    <Circle cx="30" cy="120" r="4" fill={colors.text} stroke={colors.blue} strokeWidth="2" />
                    <Circle cx="70" cy="95" r="4" fill={colors.text} stroke={colors.blue} strokeWidth="2" />
                    <Circle cx="110" cy="125" r="4" fill={colors.text} stroke={colors.blue} strokeWidth="2" />
                    <Circle cx="150" cy="70" r="4" fill={colors.text} stroke={colors.blue} strokeWidth="2" />
                    <Circle cx="190" cy="100" r="4" fill={colors.text} stroke={colors.blue} strokeWidth="2" />
                    <Circle cx="230" cy="45" r="4" fill={colors.text} stroke={colors.blue} strokeWidth="2" />
                    <Circle cx="270" cy="75" r="4" fill={colors.text} stroke={colors.blue} strokeWidth="2" />
                    <SvgText x="30" y="145" fill={colors.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">M</SvgText>
                    <SvgText x="70" y="145" fill={colors.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">T</SvgText>
                    <SvgText x="110" y="145" fill={colors.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">W</SvgText>
                    <SvgText x="150" y="145" fill={colors.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">T</SvgText>
                    <SvgText x="190" y="145" fill={colors.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">F</SvgText>
                    <SvgText x="230" y="145" fill={colors.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">S</SvgText>
                    <SvgText x="270" y="145" fill={colors.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">S</SvgText>
                  </Svg>
                </View>
              </GlassCard>

              <GlassCard borderColor="rgba(255,255,255,0.08)" glowColor="rgba(201,168,76,0.04)" padding={16} style={{ gap: 12 }}>
                <Text style={s.graphTitle}>User Base Distribution</Text>
                <Text style={s.graphSubtitle}>Active user counts by category</Text>
                <View style={{ gap: 10, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>Citizens (Users)</Text>
                    <Text style={{ color: colors.gold, fontSize: 12, fontFamily: 'Sora_700Bold' }}>1,248 (85%)</Text>
                  </View>
                  <View style={s.barBg}><View style={[s.barFill, { width: '85%', backgroundColor: colors.gold }]} /></View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>Municipal Officers</Text>
                    <Text style={{ color: colors.blue, fontSize: 12, fontFamily: 'Sora_700Bold' }}>180 (12%)</Text>
                  </View>
                  <View style={s.barBg}><View style={[s.barFill, { width: '12%', backgroundColor: colors.blue }]} /></View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>System Administrators</Text>
                    <Text style={{ color: colors.green, fontSize: 12, fontFamily: 'Sora_700Bold' }}>44 (3%)</Text>
                  </View>
                  <View style={s.barBg}><View style={[s.barFill, { width: '3%', backgroundColor: colors.green }]} /></View>
                </View>
              </GlassCard>
            </View>

            <GlassCard borderColor="rgba(201,168,76,0.15)" glowColor="rgba(201,168,76,0.06)" padding={16} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.graphTitle}>🧠 AI Insights</Text>
                <Pressable
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setInsightsLoading(true);
                    const result = await generateInsights(complaints);
                    setAiInsights(result);
                    setInsightsLoading(false);
                  }}
                  disabled={insightsLoading}
                  style={{ backgroundColor: colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  {insightsLoading ? (
                    <ActivityIndicator size="small" color={colors.navy} />
                  ) : (
                    <Text style={{ color: colors.navy, fontSize: 12, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>
                      {aiInsights ? 'Refresh' : 'Generate'}
                    </Text>
                  )}
                </Pressable>
              </View>
              {aiInsights ? (
                <View style={{ gap: 10 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora_400Regular', lineHeight: 20 }}>
                    {aiInsights.summary}
                  </Text>
                  {aiInsights.trends ? (
                    <Text style={{ color: colors.gold, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>
                      📈 {aiInsights.trends}
                    </Text>
                  ) : null}
                  {aiInsights.recommendations.length > 0 && (
                    <View style={{ gap: 6 }}>
                      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', fontFamily: 'Sora_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Recommendations
                      </Text>
                      {aiInsights.recommendations.map((rec, i) => (
                        <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                          <Text style={{ color: colors.blue, fontSize: 12 }}>→</Text>
                          <Text style={{ color: colors.text, fontSize: 12, flex: 1, fontFamily: 'Sora_400Regular', lineHeight: 18 }}>{rec}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={{ color: colors.muted, fontSize: 12, fontFamily: 'Sora_400Regular', fontStyle: 'italic' }}>
                  Tap "Generate" to get AI-powered insights and recommendations based on complaint data.
                </Text>
              )}
            </GlassCard>

            <Text style={s.sectionTitle}>💬 Live Citizen Support Chats</Text>
            {selectedChatId ? (
              <GlassCard borderColor="rgba(255,255,255,0.08)" glowColor="rgba(61,142,240,0.04)" padding={16} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>
                      {chats.find((c) => c.id === selectedChatId)?.userName}
                    </Text>
                    <Text style={{ color: colors.gold, fontSize: 11, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                      Issue: {chats.find((c) => c.id === selectedChatId)?.issue}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedChatId(null)}
                    style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}
                    accessibilityLabel="Close chat"
                  >
                    <Text style={{ color: colors.muted, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>Close</Text>
                  </Pressable>
                </View>
                <ScrollView style={{ height: 200 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
                  {chats.find((c) => c.id === selectedChatId)?.messages.map((m, idx) => {
                    const isAdmin = m.sender === 'admin';
                    const isBot = m.sender === 'bot';
                    return (
                      <View key={idx} style={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <View
                          style={{
                            backgroundColor: isAdmin ? colors.blue : isBot ? 'rgba(255,255,255,0.03)' : colors.gold,
                            padding: 10,
                            borderRadius: 14,
                            borderBottomRightRadius: isAdmin ? 2 : 14,
                            borderBottomLeftRadius: !isAdmin && !isBot ? 2 : 14,
                            borderWidth: isBot ? 1 : 0,
                            borderColor: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          <Text style={{ color: isAdmin ? '#fff' : isBot ? colors.text : colors.navy, fontSize: 13, fontFamily: 'Sora_400Regular' }}>
                            {m.text}
                          </Text>
                          <Text style={{ fontSize: 9, color: isAdmin ? 'rgba(255,255,255,0.6)' : isBot ? colors.muted : 'rgba(5,16,30,0.5)', alignSelf: 'flex-end', marginTop: 4 }}>
                            {m.time}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 6 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(13,27,46,0.45)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: colors.text,
                      fontSize: 13,
                      fontFamily: 'Sora_400Regular',
                    }}
                    placeholder="Type reply to citizen..."
                    placeholderTextColor={colors.muted}
                    value={adminReplyText}
                    onChangeText={setAdminReplyText}
                    onSubmitEditing={handleSendAdminReply}
                    accessibilityLabel="Admin reply input"
                  />
                  <Pressable
                    onPress={handleAiSuggestReply}
                    disabled={generatingReply}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel="AI suggest reply"
                  >
                    {generatingReply ? (
                      <ActivityIndicator size="small" color={colors.navy} />
                    ) : (
                      <Text style={{ fontSize: 14, color: colors.navy }}>🤖</Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={handleSendAdminReply}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel="Send reply"
                  >
                    <Text style={{ fontSize: 14, color: colors.text }}>⚡</Text>
                  </Pressable>
                </View>
              </GlassCard>
            ) : (
              <View style={{ gap: 12 }}>
                {chats.map((chat) => (
                  <Pressable
                    key={chat.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedChatId(chat.id); }}
                    accessibilityLabel={`Chat with ${chat.userName}`}
                  >
                    <GlassCard
                      borderColor="rgba(255,255,255,0.08)"
                      glowColor="rgba(201,168,76,0.02)"
                      padding={16}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <View style={{ flex: 1, gap: 4, marginRight: 12 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>{chat.userName}</Text>
                        <Text style={{ color: colors.gold, fontSize: 11, fontFamily: 'Sora_600SemiBold' }} numberOfLines={1}>
                          {chat.issue}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 2 }} numberOfLines={1}>
                          {chat.messages[chat.messages.length - 1]?.text}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={{ color: colors.muted, fontSize: 10, fontFamily: 'Sora_400Regular' }}>
                          {chat.messages[chat.messages.length - 1]?.time}
                        </Text>
                        <View style={{ backgroundColor: colors.blue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>RESPOND</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <GlassCard style={s.modalCard} borderColor="rgba(201,168,76,0.3)" glowColor="rgba(201,168,76,0.08)" delay={0} padding={24}>
            <Text style={s.modalTitle}>Deploy Officer</Text>
            <Text style={s.modalSub}>Select field officer to deploy for complaint {targetComp?.id}</Text>
            <TextInput
              style={[s.input, isModalFocused && { borderColor: 'rgba(201,168,76,0.25)', backgroundColor: 'rgba(201,168,76,0.04)' }]}
              placeholder="Enter Officer Name (e.g. Ramesh Babu)"
              placeholderTextColor={colors.muted}
              value={officerName}
              onChangeText={setOfficerName}
              onFocus={() => setIsModalFocused(true)}
              onBlur={() => setIsModalFocused(false)}
              accessibilityLabel="Officer name input"
            />
            <View style={s.modalActions}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={s.cancelBtn}
                accessibilityLabel="Cancel deployment"
              >
                <Text style={s.cancelBtnText}>CANCEL</Text>
              </Pressable>
              <Pressable
                onPress={handleAssign}
                style={s.confirmBtn}
                accessibilityLabel="Confirm deployment"
              >
                <Text style={s.confirmBtnText}>DEPLOY</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 1.5, fontFamily: 'Sora_800ExtraBold' },
  subtitle: { fontSize: 11, color: colors.gold, textTransform: 'uppercase', marginTop: 2, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  badgeText: { fontSize: 9, fontWeight: '700', color: colors.danger, letterSpacing: 0.5, fontFamily: 'Sora_700Bold' },
  scroll: { padding: 20, gap: 20 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: (SW - 40 - 10) / 2,
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    gap: 4,
  },
  metricLabel: { fontSize: 10, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Sora_600SemiBold' },
  metricVal: { fontSize: 24, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  tabText: { fontSize: 13, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  tabTextActive: { color: colors.gold, fontWeight: '700', fontFamily: 'Sora_700Bold' },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    height: 38,
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterText: { fontSize: 11, fontWeight: '700', color: colors.muted, fontFamily: 'Sora_600SemiBold' },
  filterTextActive: { color: colors.navy, fontFamily: 'Sora_700Bold' },
  queueList: { gap: 12 },
  compCard: { borderWidth: 0, padding: 0, borderRadius: 20, backgroundColor: 'transparent', gap: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compId: { fontSize: 12, fontWeight: '800', color: colors.gold, fontFamily: 'Sora_800ExtraBold' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusTagText: { fontSize: 9, fontWeight: '700', fontFamily: 'Sora_700Bold' },
  compTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' },
  compLoc: { fontSize: 12, color: colors.muted, fontFamily: 'Sora_400Regular' },
  metadataRow: { flexDirection: 'row', gap: 8 },
  metaTag: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  metaTagText: { fontSize: 11, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  dispatchBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dispatchBtnText: { color: colors.navy, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'Sora_700Bold' },
  assignedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 },
  assignedLabel: { fontSize: 12, color: colors.muted, fontFamily: 'Sora_400Regular' },
  resolveBtn: { backgroundColor: colors.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  resolveBtnText: { color: colors.navy, fontSize: 11, fontWeight: '800', fontFamily: 'Sora_700Bold' },
  officersList: { gap: 12 },
  officerCard: { borderWidth: 0, padding: 0, borderRadius: 20, backgroundColor: 'transparent', gap: 14 },
  officerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  officerMeta: { gap: 2 },
  officerName: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' },
  officerDept: { fontSize: 12, color: colors.muted, fontFamily: 'Sora_400Regular' },
  perf: { fontSize: 14, fontWeight: '800', color: colors.green, fontFamily: 'Sora_800ExtraBold' },
  officerStats: { flexDirection: 'row', gap: 32 },
  statLbl: { fontSize: 9, color: colors.muted, fontWeight: '700', fontFamily: 'Sora_700Bold', letterSpacing: 0.5 },
  statNum: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2, fontFamily: 'Sora_800ExtraBold' },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 14, marginVertical: 32, fontFamily: 'Sora_400Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard: { borderWidth: 0, padding: 0, borderRadius: 24, backgroundColor: 'transparent', gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  modalSub: { fontSize: 13, color: colors.muted, fontFamily: 'Sora_400Regular' },
  input: {
    backgroundColor: 'rgba(17,34,54,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Sora_400Regular',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  cancelBtnText: { color: colors.text, fontSize: 13, fontWeight: '700', fontFamily: 'Sora_600SemiBold' },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { color: colors.navy, fontSize: 13, fontWeight: '700', fontFamily: 'Sora_700Bold' },
  insightsContainer: { gap: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', marginTop: 12, marginBottom: 4 },
  graphTitle: { fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' },
  graphSubtitle: { fontSize: 11, color: colors.muted, fontFamily: 'Sora_400Regular' },
  barBg: { height: 8, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
