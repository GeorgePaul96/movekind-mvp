/**
 * Plus Jakarta Sans, loaded once in App.tsx. Custom fonts ignore `fontWeight` on Android,
 * so every text style picks a weight by family instead: `...font.bold`, never `fontWeight`.
 */
export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const font = {
  regular: { fontFamily: fontFamilies.regular },
  medium: { fontFamily: fontFamilies.medium },
  semibold: { fontFamily: fontFamilies.semibold },
  bold: { fontFamily: fontFamilies.bold },
  extrabold: { fontFamily: fontFamilies.extrabold },
} as const;
