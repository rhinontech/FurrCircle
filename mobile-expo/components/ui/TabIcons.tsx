import React, { useEffect } from 'react';
import Svg, { Path, Circle, G, Rect, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

interface TabIconProps {
  color: string;
  size: number;
  focused: boolean;
}

const IconWrapper = React.memo(({ children, focused }: { children: React.ReactNode, focused: boolean }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 12,
      stiffness: 100,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

export const HomeIcon = React.memo(({ color, size, focused }: TabIconProps) => (
  <IconWrapper focused={focused}>
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ overflow: 'visible' }}>
      <Defs>
        <RadialGradient id="homeBodyGradient" cx="30%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={focused ? "#60a5fa" : "#94a3b8"} />
          <Stop offset="100%" stopColor={focused ? "#2563eb" : "#475569"} />
        </RadialGradient>
        <LinearGradient id="roofGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </LinearGradient>
      </Defs>
      <Rect x="6" y="12" width="20" height="16" rx="6" fill="url(#homeBodyGradient)" />
      <Path d="M4 14L16 4L28 14" stroke="url(#homeBodyGradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 14L16 4L28 14" stroke="url(#roofGlowGradient)" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="10" cy="16" r="1.5" fill="white" opacity={0.3} />
      <Rect x="13" y="20" width="6" height="8" rx="3" fill="rgba(0,0,0,0.2)" />
    </Svg>
  </IconWrapper>
));

export const PetsIcon = React.memo(({ color, size, focused }: TabIconProps) => (
  <IconWrapper focused={focused}>
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ overflow: 'visible' }}>
      <Defs>
        <RadialGradient id="boneBodyGradient" cx="30%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={focused ? "#f472b6" : "#cbd5e1"} />
          <Stop offset="100%" stopColor={focused ? "#be185d" : "#64748b"} />
        </RadialGradient>
      </Defs>
      <G transform="translate(4, 4) rotate(-45 12 12)">
        <Rect x="6" y="10" width="12" height="4" rx="2" fill="url(#boneBodyGradient)" />
        <Circle cx="6" cy="10" r="4.5" fill="url(#boneBodyGradient)" />
        <Circle cx="6" cy="14" r="4.5" fill="url(#boneBodyGradient)" />
        <Circle cx="18" cy="10" r="4.5" fill="url(#boneBodyGradient)" />
        <Circle cx="18" cy="14" r="4.5" fill="url(#boneBodyGradient)" />
        <Circle cx="6" cy="8" r="1" fill="white" opacity={0.4} />
      </G>
    </Svg>
  </IconWrapper>
));

export const DiscoverIcon = React.memo(({ color, size, focused }: TabIconProps) => (
  <IconWrapper focused={focused}>
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ overflow: 'visible' }}>
      <Defs>
        <RadialGradient id="lensBodyGradient" cx="30%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={focused ? "#fbbf24" : "#94a3b8"} />
          <Stop offset="100%" stopColor={focused ? "#d97706" : "#475569"} />
        </RadialGradient>
        <RadialGradient id="glassEffectGradient" cx="30%" cy="30%" r="50%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Path d="M21 21L27 27" stroke="url(#lensBodyGradient)" strokeWidth="7" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="9" fill="url(#lensBodyGradient)" />
      <Circle cx="12" cy="12" r="6" fill="rgba(255,255,255,0.15)" />
      <Circle cx="10" cy="10" r="3" fill="url(#glassEffectGradient)" />
    </Svg>
  </IconWrapper>
));

export const CommunityIcon = React.memo(({ color, size, focused }: TabIconProps) => (
  <IconWrapper focused={focused}>
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ overflow: 'visible' }}>
      <Defs>
        <RadialGradient id="heartClayGradient" cx="30%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={focused ? "#818cf8" : "#94a3b8"} />
          <Stop offset="100%" stopColor={focused ? "#4338ca" : "#475569"} />
        </RadialGradient>
      </Defs>
      <Path
        d="M16 28s-12-7-12-14.5c0-4 3.5-6.5 6.5-6.5 2.5 0 4.5 2 5.5 4 1-2 3-4 5.5-4 3 0 6.5 2.5 6.5 6.5 0 7.5-12 14.5-12 14.5z"
        fill="url(#heartClayGradient)"
      />
      <Path d="M10 10c-1.5 0-3 1.5-3 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity={0.3} />
    </Svg>
  </IconWrapper>
));

export const ProfileIcon = React.memo(({ color, size, focused }: TabIconProps) => (
  <IconWrapper focused={focused}>
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ overflow: 'visible' }}>
      <Defs>
        <RadialGradient id="profileClayGradient" cx="30%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={focused ? "#34d399" : "#94a3b8"} />
          <Stop offset="100%" stopColor={focused ? "#059669" : "#475569"} />
        </RadialGradient>
      </Defs>
      <Circle cx="16" cy="10" r="6" fill="url(#profileClayGradient)" />
      <Rect x="6" y="18" width="20" height="10" rx="5" fill="url(#profileClayGradient)" />
      <Circle cx="14" cy="8" r="1.5" fill="white" opacity={0.3} />
      <Rect x="10" y="20" width="4" height="1.5" rx="0.75" fill="white" opacity={0.2} />
    </Svg>
  </IconWrapper>
));
