import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Share, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { colors } from '@/constants/colors';
import { BODY_COPY } from '@/constants/bodyCopy';
import { Body, CardTitle, NumberField, SourceLine, StepsCurve, styles } from '@/components/body/parts';
import { INSIGHTS_COPY } from '@/constants/copy';
import { ageFrom, isAdult, latestMeasurement } from '@/domain/body/composition';
import { bodySummary } from '@/domain/body/summary';
import { LIMITS, parseNumber, tidy, within } from '@/domain/body/units';
import { VO2_ERROR, activityIndex, restingPulse, vo2peak } from '@/domain/insights/fitness';
import { patterns } from '@/domain/insights/patterns';
import { buildReport } from '@/domain/insights/report';
import { SLEEP_NEED_RANGE, sleepBalance } from '@/domain/insights/sleepDebt';
import { stepsHealth } from '@/domain/insights/stepsHealth';
import BodyView from '@/screens/main/BodyView';
import { useBodyStore } from '@/store/bodyStore';
import { useGardenStore } from '@/store/gardenStore';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';

const PULSE_SECONDS = 30;

const local = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, marginBottom: 6 },
  grow: { flex: 1 },
});

/** The resting pulse counter: a 30 second timer and the count the person made. */
function PulseCounter() {
  const pulses = useBodyStore((s) => s.pulses);
  const logPulse = useBodyStore((s) => s.logPulse);
  const [left, setLeft] = useState<number | null>(null);
  const [count, setCount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    setLeft(PULSE_SECONDS);
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s === null || s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const save = async () => {
    const n = parseNumber(count);
    const bpm = n == null ? null : n * (60 / PULSE_SECONDS);
    if (bpm == null || !within(bpm, LIMITS.bpm)) return setError(INSIGHTS_COPY.pulseInvalid);
    setError(null);
    await logPulse(bpm);
    setCount('');
    setLeft(null);
  };

  const latest = restingPulse(pulses, new Date());
  return (
    <View>
      <Text style={styles.fieldLabel}>{INSIGHTS_COPY.pulseTitle}</Text>
      <Body>{INSIGHTS_COPY.pulseBody}</Body>
      {latest != null ? <Text style={styles.strong}>{INSIGHTS_COPY.pulseLatest(latest)}</Text> : null}
      {left !== null && left > 0 ? (
        <Text style={styles.strong} accessibilityLiveRegion="polite">
          {INSIGHTS_COPY.pulseCounting(left)}
        </Text>
      ) : (
        <Button label={INSIGHTS_COPY.pulseStart} variant="secondary" size="sm" onPress={start} />
      )}
      {left === 0 ? <Text style={styles.strong}>{INSIGHTS_COPY.pulseDone}</Text> : null}
      <NumberField label={INSIGHTS_COPY.pulseInput} value={count} onChangeText={setCount} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={INSIGHTS_COPY.pulseSave} size="sm" onPress={() => void save()} />
    </View>
  );
}

/** Insights, shown inside the yard drawer. Numbers appear only when the Body switch is on. */
export default function InsightsView() {
  const bodyEnabled = useSettingsStore((s) => s.bodyEnabled);
  const units = useSettingsStore((s) => s.units);
  const name = useProfileStore((s) => s.profile?.name ?? null);
  const { checkIns, water, workouts, meals, sleep, stepsStatus } = useGardenStore();
  const allSteps = useGardenStore((s) => s.stepsByDay);
  const stepsByDay = stepsStatus === 'granted' ? allSteps : undefined;
  const { profile, measurements, pulses, loaded, load, saveProfile } = useBodyStore();
  const [exportError, setExportError] = useState(false);
  const noticeSeen = useSettingsStore((s) => s.bodyNoticeSeen);
  // The numbers appear only once the switch is on and the one-time notice has been read.
  const showBody = bodyEnabled && noticeSeen;

  useEffect(() => {
    if (bodyEnabled && !loaded) void load();
  }, [bodyEnabled, loaded, load]);

  const now = useMemo(() => new Date(), [checkIns, water, workouts, sleep, measurements, pulses, profile]); // eslint-disable-line react-hooks/exhaustive-deps
  const found = useMemo(
    () => patterns({ checkIns, sleep, workouts, water, stepsByDay }, now),
    [checkIns, sleep, workouts, water, stepsByDay, now],
  );

  const adult = isAdult(profile, now);
  const age = profile?.birth_year != null ? ageFrom(profile.birth_year, now) : null;
  const need = profile?.sleep_need_hours ?? 7.5;
  const balance = bodyEnabled ? sleepBalance(sleep, need, now) : null;
  const health = bodyEnabled && adult && age != null ? stepsHealth(stepsByDay, age, now) : null;

  const latest = latestMeasurement(measurements);
  const pulse = restingPulse(pulses, now);
  const activity = activityIndex(workouts, now);
  const fitness =
    bodyEnabled && adult && profile?.sex && age != null && latest?.waist_cm && pulse != null
      ? vo2peak({ sex: profile.sex, age, waist_cm: latest.waist_cm, restingPulse: pulse, activityIndex: activity.index })
      : null;

  const onExport = async () => {
    setExportError(false);
    const report = buildReport(
      {
        name,
        checkIns,
        water,
        workouts,
        meals,
        sleep,
        patterns: found,
        bodyEnabled,
        units,
        body: bodyEnabled
          ? {
              profile,
              measurements,
              pulses,
              summary: bodySummary({ profile, measurements, workouts, stepsByDay }, now),
              sleepBalance: balance,
              stepsHealth: health,
            }
          : undefined,
      },
      new Date(),
    );
    try {
      await Share.share({ message: `${report.text}\n\n${INSIGHTS_COPY.report.data}\n${report.json}` });
    } catch {
      setExportError(true);
    }
  };

  return (
    <View>
      <Card style={styles.card}>
        <CardTitle icon="link-variant" title={INSIGHTS_COPY.patternsTitle} />
        {found.length ? (
          <>
            {found.map((p) => (
              <Text key={p.kind} style={styles.strong}>
                {INSIGHTS_COPY.patterns[p.kind][p.direction]}
              </Text>
            ))}
            <Text style={styles.source}>{INSIGHTS_COPY.patternsNote}</Text>
          </>
        ) : (
          <Body>{INSIGHTS_COPY.patternsEmpty}</Body>
        )}
      </Card>

      <Card style={styles.card}>
        <View style={local.switchRow}>
          <View style={local.grow}>
            <Text style={styles.cardTitle}>{BODY_COPY.switchTitle}</Text>
          </View>
          <Switch
            value={bodyEnabled}
            onValueChange={(v) => void useSettingsStore.getState().setBodyEnabled(v)}
            accessibilityLabel={BODY_COPY.switchLabel}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
          />
        </View>
        <Body>{bodyEnabled ? BODY_COPY.switchOnBody : BODY_COPY.switchBody}</Body>
        {bodyEnabled && !noticeSeen ? (
          <>
            <Text style={styles.strong}>{BODY_COPY.noticeTitle}</Text>
            <Body>{BODY_COPY.noticeBody}</Body>
            <Button label={BODY_COPY.noticeOk} onPress={() => void useSettingsStore.getState().markBodyNoticeSeen()} />
          </>
        ) : null}
        {showBody ? (
          <>
            <Text style={styles.fieldLabel}>{BODY_COPY.unitsTitle}</Text>
            <View style={styles.chips}>
              <Chip
                label={BODY_COPY.units.metric}
                selected={units === 'metric'}
                onPress={() => void useSettingsStore.getState().setUnits('metric')}
              />
              <Chip
                label={BODY_COPY.units.imperial}
                selected={units === 'imperial'}
                onPress={() => void useSettingsStore.getState().setUnits('imperial')}
              />
            </View>
          </>
        ) : null}
      </Card>

      {showBody ? (
        <>
          <BodyView />

          <Card style={styles.card}>
            <CardTitle icon="power-sleep" title={INSIGHTS_COPY.sleepTitle} />
            {balance ? (
              <Text style={styles.strong}>
                {balance.hoursBehind > 0
                  ? INSIGHTS_COPY.sleepBehind(balance.hoursBehind, balance.nights)
                  : INSIGHTS_COPY.sleepLevel(balance.nights)}
              </Text>
            ) : (
              <Body>{INSIGHTS_COPY.sleepEmpty}</Body>
            )}
            <View style={styles.stepper}>
              <View style={styles.stepperBtn}>
                <Button
                  label={INSIGHTS_COPY.less}
                  size="sm"
                  variant="secondary"
                  accessibilityLabel={INSIGHTS_COPY.sleepNeedLess}
                  disabled={need <= SLEEP_NEED_RANGE[0]}
                  onPress={() => void saveProfile({ sleep_need_hours: Math.max(SLEEP_NEED_RANGE[0], need - 0.5) })}
                />
              </View>
              <Text style={styles.stepperText}>{INSIGHTS_COPY.sleepNeed(need)}</Text>
              <View style={styles.stepperBtn}>
                <Button
                  label={INSIGHTS_COPY.more}
                  size="sm"
                  variant="secondary"
                  accessibilityLabel={INSIGHTS_COPY.sleepNeedMore}
                  disabled={need >= SLEEP_NEED_RANGE[1]}
                  onPress={() => void saveProfile({ sleep_need_hours: Math.min(SLEEP_NEED_RANGE[1], need + 0.5) })}
                />
              </View>
            </View>
            <SourceLine id="sleep" />
          </Card>

          {adult ? (
            <>
              <Card style={styles.card}>
                <CardTitle icon="shoe-print" title={INSIGHTS_COPY.stepsTitle} />
                {health ? (
                  <>
                    <Text style={styles.strong}>{INSIGHTS_COPY.stepsAverage(health.average)}</Text>
                    <StepsCurve average={health.average} label={INSIGHTS_COPY.stepsChartA11y(health.average)} />
                    <Body>{INSIGHTS_COPY.stepsRisk(Math.round((1 - health.relativeRisk) * 100))}</Body>
                    <Body>{INSIGHTS_COPY.stepsPlateau(health.plateau[0], health.plateau[1])}</Body>
                    <Text style={styles.source}>{INSIGHTS_COPY.stepsNote}</Text>
                    <SourceLine id="steps" />
                  </>
                ) : (
                  <Body>{INSIGHTS_COPY.stepsEmpty}</Body>
                )}
              </Card>

              <Card style={styles.card}>
                <CardTitle icon="heart-pulse" title={INSIGHTS_COPY.fitnessTitle} />
                <Body>{INSIGHTS_COPY.fitnessBody}</Body>
                {fitness != null && profile?.sex ? (
                  <>
                    <Text style={styles.strong}>
                      {INSIGHTS_COPY.fitnessValue(tidy(fitness), String(VO2_ERROR[profile.sex]))}
                    </Text>
                    <Text style={styles.source}>
                      {INSIGHTS_COPY.fitnessAssumed(
                        tidy(activity.perWeek),
                        Math.round(activity.avgMinutes),
                        activity.intensity === 'breathing-hard',
                      )}
                    </Text>
                    <SourceLine id="fitness" />
                  </>
                ) : (
                  <Text style={styles.strong}>{INSIGHTS_COPY.fitnessNeeds}</Text>
                )}
                <PulseCounter />
              </Card>
            </>
          ) : null}
        </>
      ) : null}

      <Card style={styles.card}>
        <CardTitle icon="export-variant" title={INSIGHTS_COPY.exportTitle} />
        <Body>{INSIGHTS_COPY.exportBody}</Body>
        {exportError ? <Text style={styles.error}>{INSIGHTS_COPY.exportFailed}</Text> : null}
        <Button label={INSIGHTS_COPY.exportButton} variant="secondary" onPress={() => void onExport()} />
      </Card>
    </View>
  );
}
