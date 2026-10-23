import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Garden: undefined;
  Changes: undefined;
  Me: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Onboarding: undefined;
};
