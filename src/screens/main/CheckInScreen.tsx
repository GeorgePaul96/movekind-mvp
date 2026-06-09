import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Slider } from '@/components/Slider';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useCheckInStore } from '@/store/checkInStore';
import type { BodyState, EmotionState } from '@/domain/recovery/recoveryEngine';
import { useNavigation } from '@react-navigation/native';

const BODY_STATES: BodyState[] = ['Relaxed', 'Tense', 'Wired', 'Exhausted', 'Restless', 'Heavy'];
const EMOTIONS: EmotionState[] = ['Calm', 'Focused', 'Overwhelmed', 'Anxious', 'Frustrated', 'Drained', 'Hopeful'];

export default function CheckInScreen() {
  const user = useAuthStore((s) => s.user);
  const submitCheckIn = useCheckInStore((s) => s.submitCheckIn);
  const loading = useCheckInStore((s) => s.loading);
  const navigation = useNavigation();

  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [bodyState, setBodyState] = useState<BodyState | null>(null);
  const [emotions, setEmotions] = useState<EmotionState[]>([]);

  const toggleEmotion = (emotion: EmotionState) => {
    if (emotions.includes(emotion)) {
      setEmotions(emotions.filter((e) => e !== emotion));
    } else if (emotions.length < 2) {
      setEmotions([...emotions, emotion]);
    }
  };

  const onSave = async () => {
    if (!user || !bodyState) {
      Alert.alert('Incomplete', 'Please select a body state before saving.');
      return;
    }

    await submitCheckIn(user.id, {
      energy,
      stress,
      bodyState,
      emotions,
    });

    navigation.goBack();
  };

  return (
    <Screen>
      <Header title="Daily Check-In" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.section}>
          <Text style={styles.prompt}>How much energy do you have right now?</Text>
          <Slider value={energy} onChange={setEnergy} min={0} max={10} step={1} />
        </View>

        <View style={styles.section}>
          <Text style={styles.prompt}>How much pressure are you carrying right now?</Text>
          <Slider value={stress} onChange={setStress} min={0} max={10} step={1} />
        </View>

        <View style={styles.section}>
          <Text style={styles.prompt}>Select your body state:</Text>
          <View style={styles.grid}>
            {BODY_STATES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setBodyState(s)}
                style={[styles.pill, bodyState === s && styles.pillActive]}
              >
                <Text style={[styles.pillText, bodyState === s && styles.pillTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.prompt}>Select up to 2 emotions:</Text>
          <View style={styles.grid}>
            {EMOTIONS.map((e) => {
              const active = emotions.includes(e);
              return (
                <Pressable
                  key={e}
                  onPress={() => toggleEmotion(e)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button label="Save Check-In" onPress={onSave} loading={loading} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 20 },
  section: { marginBottom: 24 },
  prompt: { fontSize: 16, color: colors.ink, fontWeight: '500', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  pillText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  pillTextActive: { color: '#fff' },
});
