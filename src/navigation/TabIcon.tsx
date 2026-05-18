import React from 'react';
import { Text } from 'react-native';

interface Props {
  focused: boolean;
  emoji: string;
}

export function TabIcon({ focused, emoji }: Props) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );
}
