import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  message: string | null;
  onHide: () => void;
}

export function Toast({ message, onHide }: Props) {
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (!message) return;
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }).start(() => onHide());
    }, 2200);
    return () => clearTimeout(t);
  }, [message, translateY, onHide]);

  if (!message) return null;
  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: colors.sage,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 999,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
