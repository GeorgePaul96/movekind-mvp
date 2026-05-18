import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function RatingRow({ value, onChange, min = 1, max = 10 }: Props) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <View style={styles.row}>
      {options.map((n) => {
        const selected = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.btn, selected && styles.selected]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  btn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.sage, borderColor: colors.sage },
  text: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  selectedText: { color: '#fff' },
});
