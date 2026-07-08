import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { colors } from '@/constants/colors';

interface Props {
  message: string | null;
  onHide: () => void;
}

export function Toast({ message, onHide }: Props) {
  const reducedMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (!message) return;
    if (reducedMotion) {
      translateY.setValue(0);
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    }
    const t = setTimeout(() => {
      if (reducedMotion) {
        translateY.setValue(-80);
        onHide();
      } else {
        Animated.timing(translateY, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide());
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [message, translateY, onHide, reducedMotion]);

  if (!message) return null;
  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }] }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 999,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  text: { color: colors.onPrimary, fontSize: 13, fontWeight: '500' },
});
