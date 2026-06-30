import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInRight,
  FadeInLeft,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import { t } from '../i18n';

export default function ChatScreen() {
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
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <ScreenLayout>
      <View style={s.header}>
        <BackButton />
        <View style={s.headerTitleWrapper}>
          <View style={s.row}>
            <Image
              source={require('../../assets/images/civic_logo_transparent.png')}
              style={{ width: 160, height: 46 }}
              contentFit="contain"
            />
          </View>
        </View>
        <Pressable
          onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
          style={s.helpBtn}
          accessibilityLabel="Help"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 22, color: colors.gold }}>❓</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {chatMessages.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>🤖</Text>
              <Text style={s.emptyTitle}>{t('chat.emptyTitle')}</Text>
              <Text style={s.emptySub}>{t('chat.emptySub')}</Text>
            </View>
          ) : chatMessages.map((msg, idx) => {
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

        <View style={s.hudRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
            {[
              'Where is my complaint?',
              'What is the status of CIV-001?',
              'How do I submit a new report?',
              'Which departments handle pothole complaints?',
            ].map((q) => (
              <Pressable
                key={q}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  sendChatMessage(q);
                }}
                style={s.hudChip}
                accessibilityLabel={`Ask: ${q}`}
              >
                <Text style={s.hudChipText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={s.footer}>
          <TextInput
            style={[
              s.input,
              isFocused && { borderColor: 'rgba(201,168,76,0.25)', backgroundColor: 'rgba(201,168,76,0.04)' },
            ]}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSend}
            accessibilityLabel="Chat message input"
          />
          <Pressable
            onPress={handleSend}
            style={s.sendBtn}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 16, color: colors.navy, fontWeight: '700' }}>⚡</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  headerTitleWrapper: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  helpBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chatList: { padding: 24, gap: 20 },
  bubbleWrapper: { flexDirection: 'row', gap: 12, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  botWrapper: { alignSelf: 'flex-start' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(13,27,46,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  avatarText: { fontSize: 16 },
  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  userBubble: { backgroundColor: colors.gold, borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: 'rgba(13,27,46,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderBottomLeftRadius: 4 },
  bubbleTxt: { fontSize: 14, lineHeight: 20, fontFamily: 'Sora_400Regular' },
  userTxt: { color: colors.navy, fontWeight: '500', fontFamily: 'Sora_600SemiBold' },
  botTxt: { color: colors.text, fontFamily: 'Sora_600SemiBold' },
  time: { fontSize: 9, alignSelf: 'flex-end', fontFamily: 'Sora_400Regular' },
  hudRow: { paddingVertical: 8, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  hudChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  hudChipText: { fontSize: 11, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  footer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 12, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Sora_400Regular',
  },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20, fontFamily: 'Sora_400Regular' },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
