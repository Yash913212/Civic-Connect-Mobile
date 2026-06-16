import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeInRight,
  FadeInLeft,
  FadeInDown,
  Layout
} from 'react-native-reanimated';
import { useAppStore } from '../store';
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

export default function ChatScreen() {
  const router = useRouter();
  const chatMessages = useAppStore((s) => s.chatMessages);
  const sendChatMessage = useAppStore((s) => s.sendChatMessage);
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);


  const handleSend = () => {
    if (text.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      sendChatMessage(text.trim());
      setText('');
      // Auto scroll to bottom
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
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
          <View style={s.headerTitleWrapper}>
            <View style={s.row}>
              <Image 
                source={require('../../assets/images/civic_logo_transparent.png')} 
                style={{ width: 160, height: 46 }} 
                contentFit="contain" 
              />
            </View>
          </View>
          <Pressable onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)} style={s.helpBtn}>
            <Text style={{ fontSize: 22, color: C.gold }}>❓</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Chat area */}
          <ScrollView 
            ref={scrollRef}
            contentContainerStyle={s.chatList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
             {chatMessages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <Animated.View 
                  key={idx} 
                  entering={isUser ? FadeInRight.springify().damping(16).mass(0.8) : FadeInLeft.springify().damping(16).mass(0.8)}
                  layout={Layout.springify().damping(14)}
                  style={[s.bubbleWrapper, isUser ? s.userWrapper : s.botWrapper]}
                >
                  {!isUser && (
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={s.avatar}>
                      <Text style={s.avatarText}>🤖</Text>
                    </Animated.View>
                  )}
                  {isUser ? (
                    <View style={[s.bubble, s.userBubble]}>
                      <Text style={[s.bubbleTxt, s.userTxt]}>{msg.text}</Text>
                      <Text style={[s.time, { color: 'rgba(5,16,30,0.5)' }]}>{msg.time}</Text>
                    </View>
                  ) : (
                    <GlassCard
                      borderColor="rgba(255,255,255,0.08)"
                      glowColor="rgba(61,142,240,0.04)"
                      padding={12}
                      style={[s.bubble, s.botBubble]}
                    >
                      <Text style={[s.bubbleTxt, s.botTxt]}>{msg.text}</Text>
                      <Text style={[s.time, { color: 'rgba(255,255,255,0.4)' }]}>{msg.time}</Text>
                    </GlassCard>
                  )}
                </Animated.View>
              );
            })}

          </ScrollView>

          {/* Quick suggestions HUD */}
          <View style={s.hudRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
              {[
                "Where is my complaint?",
                "What is the status of CIV-001?",
                "How do I submit a new report?",
                "Which departments handle pothole complaints?"
              ].map((q) => (
                <Pressable 
                  key={q} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    sendChatMessage(q);
                  }} 
                  style={s.hudChip}
                >
                  <Text style={s.hudChipText}>{q}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Input control panel */}
          <View style={s.footer}>
            <TextInput 
              style={[
                s.input,
                isFocused && { borderColor: 'rgba(201,168,76,0.25)', backgroundColor: 'rgba(201,168,76,0.04)' }
              ]}
              placeholder="Ask anything about municipal services..."
              placeholderTextColor={C.muted}
              value={text}
              onChangeText={setText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleSend}
            />
            <Pressable onPress={handleSend} style={s.sendBtn}>
              <Text style={{ fontSize: 16, color: C.navy, fontWeight: '700' }}>⚡</Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
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
  headerTitleWrapper: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: 1.5, fontFamily: 'Sora_800ExtraBold' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  subtitle: { fontSize: 10, color: C.gold, textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.5, fontFamily: 'Sora_600SemiBold' },
  helpBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chatList: { padding: 24, gap: 20 },
  bubbleWrapper: { flexDirection: 'row', gap: 12, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  botWrapper: { alignSelf: 'flex-start' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(13,27,46,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  avatarText: { fontSize: 16 },
  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  userBubble: { backgroundColor: C.gold, borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: 'rgba(13,27,46,0.75)', borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleTxt: { fontSize: 14, lineHeight: 20, fontFamily: 'Sora_400Regular' },
  userTxt: { color: C.navy, fontWeight: '500', fontFamily: 'Sora_600SemiBold' },
  botTxt: { color: C.text, fontFamily: 'Sora_600SemiBold' },
  time: { fontSize: 9, alignSelf: 'flex-end', fontFamily: 'Sora_400Regular' },
  hudRow: { paddingVertical: 8, borderTopWidth: 1, borderColor: C.border },
  hudChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: C.border
  },
  hudChipText: { fontSize: 11, color: C.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },

  footer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 12, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: C.text,
    fontSize: 14,
    fontFamily: 'Sora_400Regular'
  },

  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  }
});
