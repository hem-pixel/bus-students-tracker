// FILE: src/theme/typography.js
import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  fontFamilyMono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'monospace',
  }),
  sizes: {
    hero: 32,
    h1: 26,
    h2: 22,
    h3: 18,
    body: 15,
    caption: 13,
    micro: 11,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  }
};
