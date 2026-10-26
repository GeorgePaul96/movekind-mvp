// Minimal global mocks. Most Expo modules don't run inside Jest preset.
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
