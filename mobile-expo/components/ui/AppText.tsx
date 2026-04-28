import React from 'react';
import { Text as RNText, TextProps, StyleSheet, Platform } from 'react-native';

const weightToInter: Record<string, string> = {
  '100': 'Inter_400Regular',
  '200': 'Inter_400Regular',
  '300': 'Inter_400Regular',
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
  '900': 'Inter_900Black',
  normal: 'Inter_400Regular',
  bold: 'Inter_700Bold',
};

export function AppText({ style, allowFontScaling, ...props }: TextProps) {
  if (Platform.OS === 'ios') {
    // iOS: SF Pro renders natively — just lock font scaling so sizes match Android
    return (
      <RNText
        {...props}
        allowFontScaling={allowFontScaling ?? false}
        style={style}
      />
    );
  }

  // Android: flatten the style to read fontWeight, map it to the correct Inter
  // font file, then strip fontWeight — the named file already encodes the weight
  // and leaving fontWeight causes Android to seek a non-existent bold variant,
  // making the text render lighter than intended.
  const flat = StyleSheet.flatten(style) || {};
  const weight = String(flat.fontWeight ?? '400');
  const fontFamily = weightToInter[weight] ?? 'Inter_400Regular';
  const { fontWeight: _stripped, ...restStyle } = flat;

  return (
    <RNText
      {...props}
      allowFontScaling={allowFontScaling ?? false}
      style={[restStyle, { fontFamily }]}
    />
  );
}
