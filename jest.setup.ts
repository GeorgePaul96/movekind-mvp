// Minimal global mocks. Most Expo modules don't run inside Jest preset.
// The park's animations run on the UI thread, which Jest doesn't have.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => {
  const { Image, ScrollView, Text, View } = require('react-native');
  const value = (v: unknown) => v;
  const Animated = { View, Text, Image, ScrollView, createAnimatedComponent: (c: unknown) => c };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (f: () => unknown) => f(),
    withTiming: value,
    withSpring: value,
    withRepeat: value,
    withSequence: (...v: unknown[]) => v[v.length - 1],
    runOnJS: (f: unknown) => f,
    Easing: { linear: value, sin: value, inOut: value },
  };
});
// Gestures need the native module too: taps still work, drags are covered on a phone.
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const chain: object = new Proxy({}, { get: () => () => chain });
  return {
    Gesture: { Pan: () => chain },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: View,
  };
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => ''),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

// Icons are decorative (see src/components/Icon.tsx). On SDK 58 the real component loads its
// icon font through the asset registry, which Jest doesn't have, so tests draw a plain stand-in.
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const Stub = ({ name }: { name: string }) => require('react').createElement(Text, { testID: `icon-${name}` }, '');
  return { MaterialCommunityIcons: Stub };
});
