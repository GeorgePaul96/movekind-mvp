import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TabParamList } from './TabNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type { TabParamList };

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
