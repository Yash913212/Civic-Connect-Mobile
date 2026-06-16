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
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Line, Defs, Stop, Text as SvgText, LinearGradient as SvgLinearGradient } from 'react-native-svg';


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
  const user = useAppStore((s) => s.user);
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'assigned' | 'in_progress' | 'resolved'>('all');
  const [activeTab, setActiveTab] = useState<'queue' | 'officers' | 'insights'>('queue');
  
  const [targetComp, setTargetComp] = useState<Complaint | null>(null);
  const [officerName, setOfficerName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isModalFocused, setIsModalFocused] = useState(false);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [chats, setChats] = useState([
    {
      id: 'chat-1',
      userName: 'Suresh Kumar',
      issue: 'Pothole in Sector 4',
      messages: [
        { sender: 'user', text: 'Hi, there is a very deep pothole near the main crossing of Sector 4. It is causing traffic jams.', time: '10:30 AM' },
        { sender: 'bot', text: 'I have logged this pothole complaint. It has been routed to the Roads Department.', time: '10:31 AM' },
        { sender: 'user', text: 'Thanks. Can you tell me when someone will come to fix it?', time: '10:32 AM' }
      ]
    },
    {
      id: 'chat-2',
      userName: 'Priya Sharma',
      issue: 'Water Supply Outage',
      messages: [
        { sender: 'user', text: 'No water supply since morning in Sector 7. Is there a maintenance going on?', time: '10:15 AM' },
        { sender: 'bot', text: 'Yes, water department reports pipeline maintenance in Sector 7 until 4 PM.', time: '10:16 AM' }
      ]
    },
    {
      id: 'chat-3',
      userName: 'Anil Reddy',
      issue: 'Streetlight Blown Out',
      messages: [
        { sender: 'user', text: 'The streetlight outside plot 45 is completely dead. It is very dark and unsafe.', time: '09:45 AM' },
        { sender: 'bot', text: 'Logged under Electrical Department. Verification code: CIV-892.', time: '09:46 AM' }
      ]
    }
  ]);

  const handleSendAdminReply = () => {
    if (adminReplyText.trim() && selectedChatId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setChats(prev => prev.map(c => {
        if (c.id === selectedChatId) {
          return {
            ...c,
            messages: [
              ...c.messages,
              { sender: 'admin', text: adminReplyText.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]
          };
        }
        return c;
      }));
      setAdminReplyText('');
    }
  };

  if (user?.role !== 'Admin' && user?.role !== 'Officer') {
    return (
      <View style={s.container}>
        <LinearGradient
          colors={['#05101E', '#091a35', '#030c18']}
          style={StyleSheet.absoluteFill}
        />
        <GlowingOrb color={C.danger} startX={-60} startY={SH * 0.15} delay={0} />
        <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <GlassCard
            borderColor="rgba(239, 68, 68, 0.3)"
            glowColor="rgba(239, 68, 68, 0.15)"
            padding={30}
            style={{ width: '100%', alignItems: 'center', gap: 20 }}
          >
            <Text style={{ fontSize: 50 }}>🔒</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold', textAlign: 'center' }}>
              Access Restricted
            </Text>
            <Text style={{ fontSize: 14, color: C.muted, fontFamily: 'Sora_400Regular', textAlign: 'center', lineHeight: 22 }}>
              This control center is reserved for municipal administrators and dispatch officers. Citizens do not have access to dispatch operations.
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={{
                backgroundColor: C.blue,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                marginTop: 10,
                width: '100%',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: C.text, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>Go Back</Text>
            </Pressable>
          </GlassCard>
        </SafeAreaView>
      </View>
    );
  }


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
              <Text style={[s.tabText, activeTab === 'queue' && s.tabTextActive]}>Queue</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('officers')} style={[s.tab, activeTab === 'officers' && s.tabActive]}>
              <Text style={[s.tabText, activeTab === 'officers' && s.tabTextActive]}>Officers</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('insights')} style={[s.tab, activeTab === 'insights' && s.tabActive]}>
              <Text style={[s.tabText, activeTab === 'insights' && s.tabTextActive]}>Insights</Text>
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
          ) : activeTab === 'officers' ? (
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
          ) : (
            /* Insights and Chats Component */
            <View style={s.insightsContainer}>
              {/* Graphs Section */}
              <Text style={s.sectionTitle}>📊 Data Analytics</Text>
              
              {/* Grid for two graph cards */}
              <View style={{ gap: 16, marginBottom: 24 }}>
                {/* Weekly Complaints Ingestion Trend (Line Chart) */}
                <GlassCard
                  borderColor="rgba(255,255,255,0.08)"
                  glowColor="rgba(61,142,240,0.04)"
                  padding={16}
                  style={{ gap: 12 }}
                >
                  <Text style={s.graphTitle}>Weekly Ingestion Load</Text>
                  <Text style={s.graphSubtitle}>Daily complaints trend (Mon - Sun)</Text>
                  
                  {/* Svg line chart */}
                  <View style={{ height: 160, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Svg height="150" width={SW - 80} viewBox={`0 0 ${SW - 80} 150`}>
                      <Defs>
                        <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor={C.blue} stopOpacity="0.4" />
                          <Stop offset="1" stopColor={C.blue} stopOpacity="0.0" />
                        </SvgLinearGradient>
                      </Defs>
                      
                      {/* Grid Lines */}
                      <Line x1="10" y1="20" x2={SW - 90} y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <Line x1="10" y1="60" x2={SW - 90} y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <Line x1="10" y1="100" x2={SW - 90} y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      
                      {/* Smooth Path Curve representing daily values */}
                      <Path
                        d={`M 30,120 Q 50,107 70,95 T 110,125 T 150,70 T 190,100 T 230,45 T 270,75`}
                        fill="none"
                        stroke={C.blue}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      
                      {/* Area Under Curve */}
                      <Path
                        d={`M 30,120 Q 50,107 70,95 T 110,125 T 150,70 T 190,100 T 230,45 T 270,75 L 270,140 L 30,140 Z`}
                        fill="url(#grad)"
                      />

                      {/* Dots and Values */}
                      <Circle cx="30" cy="120" r="4" fill={C.text} stroke={C.blue} strokeWidth="2" />
                      <Circle cx="70" cy="95" r="4" fill={C.text} stroke={C.blue} strokeWidth="2" />
                      <Circle cx="110" cy="125" r="4" fill={C.text} stroke={C.blue} strokeWidth="2" />
                      <Circle cx="150" cy="70" r="4" fill={C.text} stroke={C.blue} strokeWidth="2" />
                      <Circle cx="190" cy="100" r="4" fill={C.text} stroke={C.blue} strokeWidth="2" />
                      <Circle cx="230" cy="45" r="4" fill={C.text} stroke={C.blue} strokeWidth="2" />
                      <Circle cx="270" cy="75" r="4" fill={C.text} stroke={C.blue} strokeWidth="2" />

                      {/* Labels */}
                      <SvgText x="30" y="145" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">M</SvgText>
                      <SvgText x="70" y="145" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">T</SvgText>
                      <SvgText x="110" y="145" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">W</SvgText>
                      <SvgText x="150" y="145" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">T</SvgText>
                      <SvgText x="190" y="145" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">F</SvgText>
                      <SvgText x="230" y="145" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">S</SvgText>
                      <SvgText x="270" y="145" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="Sora_400Regular">S</SvgText>
                    </Svg>
                  </View>
                </GlassCard>

                {/* Users Count & Distribution Stacked Bar */}
                <GlassCard
                  borderColor="rgba(255,255,255,0.08)"
                  glowColor="rgba(201,168,76,0.04)"
                  padding={16}
                  style={{ gap: 12 }}
                >
                  <Text style={s.graphTitle}>User Base Distribution</Text>
                  <Text style={s.graphSubtitle}>Active user counts by category</Text>
                  
                  <View style={{ gap: 10, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: C.text, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>Citizens (Users)</Text>
                      <Text style={{ color: C.gold, fontSize: 12, fontFamily: 'Sora_700Bold' }}>1,248 (85%)</Text>
                    </View>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: '85%', backgroundColor: C.gold }]} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ color: C.text, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>Municipal Officers</Text>
                      <Text style={{ color: C.blue, fontSize: 12, fontFamily: 'Sora_700Bold' }}>180 (12%)</Text>
                    </View>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: '12%', backgroundColor: C.blue }]} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ color: C.text, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>System Administrators</Text>
                      <Text style={{ color: C.green, fontSize: 12, fontFamily: 'Sora_700Bold' }}>44 (3%)</Text>
                    </View>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: '3%', backgroundColor: C.green }]} />
                    </View>
                  </View>
                </GlassCard>
              </View>

              {/* Citizen Chats Section */}
              <Text style={s.sectionTitle}>💬 Live Citizen Support Chats</Text>
              
              {selectedChatId ? (
                /* Chat view when selected */
                <GlassCard
                  borderColor="rgba(255,255,255,0.08)"
                  glowColor="rgba(61,142,240,0.04)"
                  padding={16}
                  style={{ gap: 12 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: C.border, paddingBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>
                        {chats.find(c => c.id === selectedChatId)?.userName}
                      </Text>
                      <Text style={{ color: C.gold, fontSize: 11, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                        Issue: {chats.find(c => c.id === selectedChatId)?.issue}
                      </Text>
                    </View>
                    <Pressable onPress={() => setSelectedChatId(null)} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                      <Text style={{ color: C.muted, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>Close</Text>
                    </Pressable>
                  </View>

                  <ScrollView style={{ height: 200 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
                    {chats.find(c => c.id === selectedChatId)?.messages.map((m, idx) => {
                      const isAdmin = m.sender === 'admin';
                      const isBot = m.sender === 'bot';
                      return (
                        <View key={idx} style={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                          <View
                            style={{
                              backgroundColor: isAdmin ? C.blue : isBot ? 'rgba(255,255,255,0.03)' : C.gold,
                              padding: 10,
                              borderRadius: 14,
                              borderBottomRightRadius: isAdmin ? 2 : 14,
                              borderBottomLeftRadius: !isAdmin && !isBot ? 2 : 14,
                              borderWidth: isBot ? 1 : 0,
                              borderColor: C.border
                            }}
                          >
                            <Text style={{ color: isAdmin ? '#fff' : isBot ? C.text : C.navy, fontSize: 13, fontFamily: 'Sora_400Regular' }}>
                              {m.text}
                            </Text>
                            <Text style={{ fontSize: 9, color: isAdmin ? 'rgba(255,255,255,0.6)' : isBot ? C.muted : 'rgba(5,16,30,0.5)', alignSelf: 'flex-end', marginTop: 4 }}>
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
                        borderColor: C.border,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: C.text,
                        fontSize: 13,
                        fontFamily: 'Sora_400Regular'
                      }}
                      placeholder="Type reply to citizen..."
                      placeholderTextColor={C.muted}
                      value={adminReplyText}
                      onChangeText={setAdminReplyText}
                      onSubmitEditing={handleSendAdminReply}
                    />
                    <Pressable
                      onPress={handleSendAdminReply}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: C.blue,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Text style={{ fontSize: 14, color: C.text }}>⚡</Text>
                    </Pressable>
                  </View>
                </GlassCard>
              ) : (
                /* Chats List */
                <View style={{ gap: 12 }}>
                  {chats.map(chat => (
                    <Pressable key={chat.id} onPress={() => setSelectedChatId(chat.id)}>
                      <GlassCard
                        borderColor="rgba(255,255,255,0.08)"
                        glowColor="rgba(201,168,76,0.02)"
                        padding={16}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <View style={{ flex: 1, gap: 4, marginRight: 12 }}>
                          <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>
                            {chat.userName}
                          </Text>
                          <Text style={{ color: C.gold, fontSize: 11, fontFamily: 'Sora_600SemiBold' }} numberOfLines={1}>
                            {chat.issue}
                          </Text>
                          <Text style={{ color: C.muted, fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 2 }} numberOfLines={1}>
                            {chat.messages[chat.messages.length - 1]?.text}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={{ color: C.muted, fontSize: 10, fontFamily: 'Sora_400Regular' }}>
                            {chat.messages[chat.messages.length - 1]?.time}
                          </Text>
                          <View style={{ backgroundColor: C.blue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
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
  confirmBtnText: { color: C.navy, fontSize: 13, fontWeight: '700', fontFamily: 'Sora_700Bold' },
  insightsContainer: { gap: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold', marginTop: 12, marginBottom: 4 },
  graphTitle: { fontSize: 14, fontWeight: '700', color: C.text, fontFamily: 'Sora_700Bold' },
  graphSubtitle: { fontSize: 11, color: C.muted, fontFamily: 'Sora_400Regular' },
  barBg: { height: 8, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 }
});
