import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Body, CardTitle, NumberField, ReportRow, Silhouette, SourceLine, styles } from '@/components/body/parts';
import { BODY_COPY } from '@/constants/copy';
import { BMI_RANGE, BODY_FAT_ERROR, WAIST_TO_HEIGHT_RANGE, bmiBand, waistToHeightBand } from '@/domain/body/composition';
import { BURN_ERROR } from '@/domain/body/energy';
import { PROJECTION_WEEKS, isTrend } from '@/domain/body/projection';
import { estimateHip, silhouette, waistAtBodyFat } from '@/domain/body/silhouette';
import { bodySummary } from '@/domain/body/summary';
import {
  LIMITS,
  fromDisplayLength,
  fromDisplayWeight,
  lengthUnit,
  parseNumber,
  tidy,
  toDisplayLength,
  toDisplayWeight,
  weightUnit,
  within,
} from '@/domain/body/units';
import { useBodyStore } from '@/store/bodyStore';
import { useGardenStore } from '@/store/gardenStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { FormulaSex } from '@/types';

const FIGURE_BOX = { width: 130, height: 250 };
const MAX_EXTRA_STEPS = 5000;
const round10 = (n: number) => Math.round(n / 10) * 10;

/** The opt-in Body section: details, today's measurements, the report and "at this pace". */
export default function BodyView() {
  const units = useSettingsStore((s) => s.units);
  const { profile, measurements, saveProfile, logMeasurement } = useBodyStore();
  const workouts = useGardenStore((s) => s.workouts);
  const stepsByDay = useGardenStore((s) => (s.stepsStatus === 'granted' ? s.stepsByDay : undefined));

  const [extraSteps, setExtraSteps] = useState(0);
  const [weeks, setWeeks] = useState<number>(PROJECTION_WEEKS[1]);
  const summary = useMemo(
    () => bodySummary({ profile, measurements, workouts, stepsByDay, extraSteps }, new Date()),
    [profile, measurements, workouts, stepsByDay, extraSteps],
  );

  const lu = lengthUnit(units);
  const wu = weightUnit(units);
  const showLen = (cm: number) => `${tidy(toDisplayLength(cm, units))} ${lu}`;
  const showWeight = (kg: number) => `${tidy(toDisplayWeight(kg, units))} ${wu}`;

  // ---- Details form -------------------------------------------------------
  const [editing, setEditing] = useState(false);
  const [sex, setSex] = useState<FormulaSex | null>(profile?.sex ?? null);
  const [birthYear, setBirthYear] = useState(profile?.birth_year ? String(profile.birth_year) : '');
  const [height, setHeight] = useState(profile?.height_cm ? tidy(toDisplayLength(profile.height_cm, units)) : '');
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    setSex(profile?.sex ?? null);
    setBirthYear(profile?.birth_year ? String(profile.birth_year) : '');
    setHeight(profile?.height_cm ? tidy(toDisplayLength(profile.height_cm, units)) : '');
  }, [profile, units]);

  const onSaveDetails = async () => {
    const year = parseNumber(birthYear);
    const h = parseNumber(height);
    const thisYear = new Date().getFullYear();
    if (!sex) return setDetailsError(BODY_COPY.invalid.sex);
    if (year == null || !Number.isInteger(year) || year < 1900 || year > thisYear) {
      return setDetailsError(BODY_COPY.invalid.birthYear);
    }
    const height_cm = h == null ? null : fromDisplayLength(h, units);
    if (height_cm == null || !within(height_cm, LIMITS.height_cm)) return setDetailsError(BODY_COPY.invalid.height);
    setDetailsError(null);
    await saveProfile({ sex, birth_year: year, height_cm: Math.round(height_cm * 10) / 10 });
    setEditing(false);
  };

  // ---- Measurement form ---------------------------------------------------
  const [weight, setWeight] = useState('');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [measureError, setMeasureError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSaveMeasure = async () => {
    setSaved(false);
    const read = (
      text: string,
      convert: (v: number) => number,
      limits: readonly [number, number],
      message: string,
    ): number | undefined | Error => {
      if (!text.trim()) return undefined;
      const n = parseNumber(text);
      const metric = n == null ? null : convert(n);
      return metric != null && within(metric, limits) ? Math.round(metric * 10) / 10 : new Error(message);
    };
    const len = (v: number) => fromDisplayLength(v, units);
    const values = {
      weight_kg: read(weight, (v) => fromDisplayWeight(v, units), LIMITS.weight_kg, BODY_COPY.invalid.weight),
      neck_cm: read(neck, len, LIMITS.neck_cm, BODY_COPY.invalid.neck),
      waist_cm: read(waist, len, LIMITS.waist_cm, BODY_COPY.invalid.waist),
      hip_cm: read(hip, len, LIMITS.hip_cm, BODY_COPY.invalid.hip),
    };
    const bad = Object.values(values).find((v): v is Error => v instanceof Error);
    if (bad) return setMeasureError(bad.message);
    if (Object.values(values).every((v) => v === undefined)) return setMeasureError(BODY_COPY.invalid.nothing);
    setMeasureError(null);
    await logMeasurement(values as { weight_kg?: number; neck_cm?: number; waist_cm?: number; hip_cm?: number });
    setWeight('');
    setNeck('');
    setWaist('');
    setHip('');
    setSaved(true);
  };

  // ---- Render -------------------------------------------------------------
  if (summary.state === 'minor' && !editing) {
    return (
      <Card style={styles.card}>
        <CardTitle icon="human" title={BODY_COPY.title} />
        <Body>{BODY_COPY.minor}</Body>
        <Button label={BODY_COPY.editDetails} variant="link" size="sm" onPress={() => setEditing(true)} />
      </Card>
    );
  }

  const detailsForm = (
    <Card style={styles.card}>
      <CardTitle icon="account-outline" title={BODY_COPY.detailsTitle} />
      <Body>{BODY_COPY.detailsBody}</Body>
      <Text style={styles.fieldLabel}>{BODY_COPY.sexTitle}</Text>
      <View style={styles.chips}>
        <Chip label={BODY_COPY.sex.male} selected={sex === 'male'} onPress={() => setSex('male')} />
        <Chip label={BODY_COPY.sex.female} selected={sex === 'female'} onPress={() => setSex('female')} />
      </View>
      <Text style={styles.source}>{BODY_COPY.sexNote}</Text>
      <NumberField label={BODY_COPY.birthYear} value={birthYear} onChangeText={setBirthYear} />
      <NumberField label={BODY_COPY.height(lu)} value={height} onChangeText={setHeight} />
      {detailsError ? <Text style={styles.error}>{detailsError}</Text> : null}
      <Button label={BODY_COPY.saveDetails} onPress={() => void onSaveDetails()} />
    </Card>
  );

  if (summary.state === 'details' || editing) return detailsForm;

  const c = summary.composition;
  const isFemale = profile?.sex === 'female';
  const proj = summary.projection;
  const trend = summary.trend;
  const k = PROJECTION_WEEKS.indexOf(weeks as (typeof PROJECTION_WEEKS)[number]);

  let figures: React.ReactNode = null;
  if (proj && proj.status === 'ok' && profile?.sex && profile.height_cm && summary.bodyFat) {
    const latest = summary.latest;
    if (latest?.neck_cm && latest.waist_cm && (!isFemale || latest.hip_cm)) {
      const base = { sex: profile.sex, height_cm: profile.height_cm, neck_cm: latest.neck_cm };
      const hipNow = latest.hip_cm ?? estimateHip(profile.sex, latest.waist_cm);
      const later = waistAtBodyFat({
        ...base,
        bodyFatPct: proj.central[k].bodyFatPct,
        waist_cm: latest.waist_cm,
        hip_cm: latest.hip_cm,
      });
      const hipLater = later.hip_cm ?? estimateHip(profile.sex, later.waist_cm);
      figures = (
        <View
          style={styles.figures}
          accessible
          accessibilityRole="image"
          accessibilityLabel={BODY_COPY.figureA11y(showLen(latest.waist_cm), showLen(later.waist_cm), weeks)}
        >
          <Silhouette
            caption={BODY_COPY.now}
            outline={silhouette(
              { ...base, waist_cm: latest.waist_cm, hip_cm: hipNow, bodyFatPct: summary.bodyFat.pct },
              FIGURE_BOX,
            )}
          />
          <Silhouette
            caption={BODY_COPY.later(weeks)}
            outline={silhouette(
              { ...base, waist_cm: later.waist_cm, hip_cm: hipLater, bodyFatPct: proj.central[k].bodyFatPct },
              FIGURE_BOX,
            )}
          />
        </View>
      );
    } else {
      figures = <Body>{BODY_COPY.figureNeedsTape}</Body>;
    }
  }

  const range = (pick: (p: { weight_kg: number; bodyFatPct: number; fatMass_kg: number; leanMass_kg: number }) => number, show: (n: number) => string) => {
    if (!proj) return '';
    const a = pick(proj.low[k]);
    const b = pick(proj.high[k]);
    return BODY_COPY.about(show(pick(proj.central[k])), show(Math.min(a, b)), show(Math.max(a, b)));
  };

  return (
    <View>
      <Card style={styles.card}>
        <CardTitle icon="tape-measure" title={BODY_COPY.measureTitle} />
        <Body>{BODY_COPY.measureBody}</Body>
        <NumberField label={BODY_COPY.weight(wu)} value={weight} onChangeText={setWeight} />
        <NumberField label={BODY_COPY.neck(lu)} value={neck} onChangeText={setNeck} />
        <NumberField label={BODY_COPY.waist(lu)} value={waist} onChangeText={setWaist} />
        <NumberField label={BODY_COPY.hip(lu)} value={hip} onChangeText={setHip} />
        {measureError ? <Text style={styles.error}>{measureError}</Text> : null}
        {saved ? <Text style={styles.strong}>{BODY_COPY.saved}</Text> : null}
        <Button label={BODY_COPY.saveMeasure} onPress={() => void onSaveMeasure()} />
        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{BODY_COPY.howTitle}</Text>
        {BODY_COPY.how.map((line) => (
          <Text key={line} style={styles.source}>
            {line}
          </Text>
        ))}
        <Button label={BODY_COPY.editDetails} variant="link" size="sm" onPress={() => setEditing(true)} />
      </Card>

      <Card style={styles.card}>
        <CardTitle icon="clipboard-text-outline" title={BODY_COPY.reportTitle} />
        {!c ? (
          <Body>{BODY_COPY.needWeight}</Body>
        ) : (
          <>
            <ReportRow label={BODY_COPY.rows.weight} value={showWeight(c.weight_kg)} />
            <ReportRow
              label={BODY_COPY.rows.bmi}
              value={tidy(c.bmi)}
              scale={{ value: c.bmi, min: 15, max: 40, range: BMI_RANGE, band: bmiBand(c.bmi) }}
            />
            <SourceLine id="bmi" />
            {c.bodyFatPct != null && c.fatMass_kg != null && c.leanMass_kg != null ? (
              <>
                <ReportRow
                  label={BODY_COPY.rows.bodyFat}
                  value={BODY_COPY.plusMinus(`${tidy(c.bodyFatPct)}%`, `${BODY_FAT_ERROR} points`)}
                />
                <ReportRow label={BODY_COPY.rows.fatMass} value={showWeight(c.fatMass_kg)} />
                <ReportRow label={BODY_COPY.rows.leanMass} value={showWeight(c.leanMass_kg)} />
                {c.ffmi != null ? <ReportRow label={BODY_COPY.rows.ffmi} value={tidy(c.ffmi)} /> : null}
                <SourceLine id="navy" />
              </>
            ) : (
              <Body>{isFemale ? BODY_COPY.needTapeFemale : BODY_COPY.needTape}</Body>
            )}
            {c.waistToHeight != null ? (
              <>
                <ReportRow
                  label={BODY_COPY.rows.waistToHeight}
                  value={tidy(c.waistToHeight, 2)}
                  scale={{
                    value: c.waistToHeight,
                    min: 0.3,
                    max: 0.8,
                    range: WAIST_TO_HEIGHT_RANGE,
                    band: waistToHeightBand(c.waistToHeight),
                  }}
                />
                <SourceLine id="waistToHeight" />
              </>
            ) : null}
            {summary.burn ? (
              <>
                <ReportRow label={BODY_COPY.rows.resting} value={BODY_COPY.kcal(round10(summary.burn.resting))} />
                <SourceLine id="mifflin" />
                <ReportRow
                  label={BODY_COPY.rows.daily}
                  value={BODY_COPY.kcalRange(
                    round10(summary.burn.daily * (1 - BURN_ERROR)),
                    round10(summary.burn.daily * (1 + BURN_ERROR)),
                  )}
                />
                {!summary.burn.hasSteps ? <Text style={styles.source}>{BODY_COPY.noStepsNote}</Text> : null}
                <SourceLine id="activity" />
              </>
            ) : null}
          </>
        )}
      </Card>

      {c ? (
        <Card style={styles.card}>
          <CardTitle icon="chart-timeline-variant" title={BODY_COPY.paceTitle} />
          <Body>{BODY_COPY.paceBody}</Body>
          {trend && !isTrend(trend) ? (
            <Text style={styles.strong}>{BODY_COPY.needMore(trend.needWeighIns, trend.needDays)}</Text>
          ) : null}
          {proj?.status === 'too-fast' ? <Text style={styles.strong}>{BODY_COPY.tooFast}</Text> : null}
          {proj?.status === 'steady' ? <Text style={styles.strong}>{BODY_COPY.steady}</Text> : null}
          {proj && proj.status !== 'too-fast' ? (
            <>
              {proj.status === 'ok' ? (
                <>
                  <View style={styles.chips}>
                    {PROJECTION_WEEKS.map((w) => (
                      <Chip
                        key={w}
                        label={BODY_COPY.span(w)}
                        accessibilityLabel={BODY_COPY.spanA11y(w)}
                        selected={weeks === w}
                        onPress={() => setWeeks(w)}
                      />
                    ))}
                  </View>
                  {figures}
                  <ReportRow label={BODY_COPY.rows.weight} value={range((p) => p.weight_kg, showWeight)} />
                  <ReportRow label={BODY_COPY.rows.bodyFat} value={range((p) => p.bodyFatPct, (n) => `${tidy(n)}%`)} />
                  <ReportRow label={BODY_COPY.rows.fatMass} value={range((p) => p.fatMass_kg, showWeight)} />
                  <ReportRow label={BODY_COPY.rows.leanMass} value={range((p) => p.leanMass_kg, showWeight)} />
                  {summary.bodyFat?.estimated ? <Text style={styles.source}>{BODY_COPY.estimatedFat}</Text> : null}
                </>
              ) : null}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{BODY_COPY.whatIfTitle}</Text>
              <View style={styles.stepper}>
                <View style={styles.stepperBtn}>
                  <Button
                    label="-1,000"
                    size="sm"
                    variant="secondary"
                    accessibilityLabel={BODY_COPY.whatIfLess}
                    disabled={extraSteps === 0}
                    onPress={() => setExtraSteps((s) => Math.max(0, s - 1000))}
                  />
                </View>
                <Text style={styles.stepperText}>{BODY_COPY.whatIf(extraSteps)}</Text>
                <View style={styles.stepperBtn}>
                  <Button
                    label="+1,000"
                    size="sm"
                    variant="secondary"
                    accessibilityLabel={BODY_COPY.whatIfMore}
                    disabled={extraSteps >= MAX_EXTRA_STEPS}
                    onPress={() => setExtraSteps((s) => Math.min(MAX_EXTRA_STEPS, s + 1000))}
                  />
                </View>
              </View>
              <Text style={styles.source}>{BODY_COPY.ignores}</Text>
              <SourceLine id="hall" />
              {summary.bodyFat?.estimated ? <SourceLine id="deurenberg" /> : null}
            </>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}
