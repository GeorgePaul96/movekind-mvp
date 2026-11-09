import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Sheet } from '@/components/park/Sheet';
import { YARD_COPY } from '@/constants/copy';
import type { Meal } from '@/types';

const MEALS: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface Props {
  visible: boolean;
  initialMeals?: Meal[];
  onSave: (meals: Meal[]) => void;
  onClose: () => void;
}

/**
 * The food bowl sheet: asks only whether you ate and which meals.
 * Never judges food, never asks for notes or calories.
 */
export function FoodSheet({ visible, initialMeals = [], onSave, onClose }: Props) {
  const [selected, setSelected] = useState<Meal[]>([]);

  useEffect(() => {
    if (visible) {
      setSelected(initialMeals);
    }
  }, [visible, initialMeals]);

  const toggleMeal = (meal: Meal) => {
    setSelected((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal],
    );
  };

  return (
    <Sheet
      visible={visible}
      title={YARD_COPY.foodSheet.title}
      subtitle={YARD_COPY.foodSheet.subtitle}
      onClose={onClose}
    >
      <View style={styles.row}>
        {MEALS.slice(0, 2).map((m) => (
          <Chip
            key={m}
            label={YARD_COPY.foodSheet.meals[m]}
            selected={selected.includes(m)}
            onPress={() => toggleMeal(m)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {MEALS.slice(2, 4).map((m) => (
          <Chip
            key={m}
            label={YARD_COPY.foodSheet.meals[m]}
            selected={selected.includes(m)}
            onPress={() => toggleMeal(m)}
          />
        ))}
      </View>
      <View style={styles.spacer} />
      <Button
        label={YARD_COPY.foodSheet.save}
        disabled={selected.length === 0}
        onPress={() => selected.length > 0 && onSave(selected)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  spacer: { height: 10 },
});