import React, { useEffect } from 'react';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '../../theme';

interface ColorProp {
  color?: string;
}

interface ActiveProp {
  active?: boolean;
  fab?: boolean;
}

export const BellIcon = () => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 3000 }),
        withTiming(-6, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(6, { duration: 150, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) }),
      ),
      -1, true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={colors.civicBlue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={colors.civicBlue} strokeWidth={1.8} strokeLinecap="round"/>
      </Svg>
    </Animated.View>
  );
};

export const AvatarIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="rgba(255,255,255,0.6)" strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx={12} cy={7} r={4} stroke="rgba(255,255,255,0.6)" strokeWidth={1.8}/>
  </Svg>
);

export const CameraIcon: React.FC<ActiveProp> = ({ fab }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (fab) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true
      );
    }
  }, [fab]);

  const style = useAnimatedStyle(() => fab ? ({
    transform: [{ scale: pulse.value }],
  }) : {});

  const color = fab ? colors.white : colors.civicBlue;
  return (
    <Animated.View style={style}>
      <Svg width={fab ? 22 : 28} height={fab ? 22 : 28} viewBox="0 0 28 28" fill="none">
        <Rect x={3} y={7} width={22} height={16} rx={3} stroke={color} strokeWidth={1.6}/>
        <Circle cx={14} cy={15} r={4.5} stroke={color} strokeWidth={1.6}/>
        <Path d="M9 7V5.5a2 2 0 012-2h6a2 2 0 012 2V7" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
        <Circle cx={21} cy={11} r={1} fill={color}/>
      </Svg>
    </Animated.View>
  );
};

export const ArrowIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M3 7h8M8 4.5l2.5 2.5-2.5 2.5" stroke={colors.civicBlue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const ListIcon: React.FC<ColorProp> = ({ color = colors.civicBlue }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Line x1={2} y1={3} x2={12} y2={3} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
    <Line x1={2} y1={7} x2={12} y2={7} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
    <Line x1={2} y1={11} x2={8} y2={11} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
  </Svg>
);

export const ClockIcon: React.FC<ColorProp> = ({ color = colors.civicBlue }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Circle cx={7} cy={7} r={5} stroke={color} strokeWidth={1.4}/>
    <Path d="M7 4v3l1.5 1.5" stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
  </Svg>
);

export const CheckIcon: React.FC<ColorProp> = ({ color = colors.civicBlue }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M2 7l4 4 6-6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const InfoIcon: React.FC<ColorProp> = ({ color = colors.civicBlue }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Circle cx={7} cy={7} r={5} stroke={color} strokeWidth={1.4}/>
    <Line x1={7} y1={5} x2={7} y2={7} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
    <Circle cx={7} cy={9.5} r={0.7} fill={color}/>
  </Svg>
);

export const HistoryIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path d="M4 5h12M4 9h12M4 13h8" stroke={colors.civicBlue} strokeWidth={1.6} strokeLinecap="round"/>
  </Svg>
);

export const CommandIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Rect x={3} y={13} width={3} height={5} rx={1} stroke={colors.civicBlue} strokeWidth={1.5}/>
    <Rect x={8.5} y={9} width={3} height={9} rx={1} stroke={colors.civicBlue} strokeWidth={1.5}/>
    <Rect x={14} y={5} width={3} height={13} rx={1} stroke={colors.civicBlue} strokeWidth={1.5}/>
    <Path d="M4.5 12l4-4 4 3 4-5" stroke={colors.civicBlue} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const HeatmapIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Circle cx={10} cy={9} r={3} stroke={colors.civicBlue} strokeWidth={1.6}/>
    <Circle cx={10} cy={9} r={6} stroke={colors.civicBlue} strokeWidth={1} strokeOpacity={0.3}/>
    <Line x1={10} y1={12} x2={10} y2={15} stroke={colors.civicBlue} strokeWidth={1.6} strokeLinecap="round"/>
  </Svg>
);

export const HomeNavIcon: React.FC<ActiveProp> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Path d="M3 10.5L11 3l8 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"
      stroke={active ? colors.civicBlue : 'rgba(255,255,255,0.35)'}
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      fill={active ? 'rgba(42,117,211,0.15)' : 'none'}/>
    <Path d="M8 21v-7h6v7" stroke={active ? colors.civicBlue : 'rgba(255,255,255,0.35)'} strokeWidth={1.7} strokeLinecap="round"/>
  </Svg>
);

export const OverviewNavIcon: React.FC<ActiveProp> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Path d="M4 17l5-5 3 3 6-7" stroke={active ? colors.civicBlue : 'rgba(255,255,255,0.35)'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/>
    <Rect x={2} y={2} width={18} height={18} rx={3} stroke={active ? 'rgba(42,117,211,0.35)' : 'rgba(255,255,255,0.2)'} strokeWidth={1}/>
  </Svg>
);

export const AlertsNavIcon: React.FC<ActiveProp> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Path d="M17 8A6 6 0 005 8c0 8-3 10-3 10h18s-3-2-3-10" stroke={active ? colors.civicBlue : 'rgba(255,255,255,0.35)'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill={active ? 'rgba(42,117,211,0.15)' : 'none'}/>
    <Path d="M13 19a2 2 0 01-4 0" stroke={active ? colors.civicBlue : 'rgba(255,255,255,0.35)'} strokeWidth={1.7} strokeLinecap="round"/>
  </Svg>
);

export const ProfileNavIcon: React.FC<ActiveProp> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Path d="M18 20v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? colors.civicBlue : 'rgba(255,255,255,0.35)'} strokeWidth={1.7} strokeLinecap="round"/>
    <Circle cx={11} cy={7} r={4} stroke={active ? colors.civicBlue : 'rgba(255,255,255,0.35)'} strokeWidth={1.7} fill={active ? 'rgba(42,117,211,0.15)' : 'none'}/>
  </Svg>
);
