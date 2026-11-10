import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { Icon, type IconName } from '@/components/Icon';
import { colors } from '@/constants/colors';
import { BODY_COPY } from '@/constants/copy';
import { SOURCES, type SourceId } from '@/constants/sources';
import { font } from '@/constants/typography';
import type { Band } from '@/domain/body/composition';
import type { Outline } from '@/domain/body/silhouette';
import { STEPS_CURVE, relativeRiskAt } from '@/domain/insights/stepsHealth';

/** Small shared pieces for the Body section and Insights. Function first, plain looks. */

export function CardTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleIcon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.cardTitle} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

/** "Source: ..." under a number, so nothing is shown without where it came from. */
export function SourceLine({ id }: { id: SourceId }) {
  return <Text style={styles.source}>{BODY_COPY.source(SOURCES[id].label)}</Text>;
}

/** A labelled number entry. */
export function NumberField({
  label,
  value,
  onChangeText,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  testID?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        inputMode="decimal"
        maxLength={7}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

/** One line of the report: a name, a value, and optionally where it sits against a reference range. */
export function ReportRow({
  label,
  value,
  scale,
}: {
  label: string;
  value: string;
  scale?: { value: number; min: number; max: number; range: readonly [number, number]; band: Band };
}) {
  const pct = (v: number) =>
    scale ? Math.min(100, Math.max(0, ((v - scale.min) / (scale.max - scale.min)) * 100)) : 0;
  return (
    <View
      style={styles.reportRow}
      accessible
      accessibilityLabel={scale ? `${label}: ${value}. ${BODY_COPY.band[scale.band]}` : `${label}: ${value}`}
    >
      <View style={styles.reportLine}>
        <Text style={styles.reportLabel}>{label}</Text>
        <Text style={styles.reportValue}>{value}</Text>
      </View>
      {scale ? (
        <>
          <View style={styles.track}>
            <View
              style={[
                styles.band,
                { left: `${pct(scale.range[0])}%`, width: `${pct(scale.range[1]) - pct(scale.range[0])}%` },
              ]}
            />
            <View style={[styles.marker, { left: `${pct(scale.value)}%` }]} />
          </View>
          <Text style={styles.bandText}>{BODY_COPY.band[scale.band]}</Text>
        </>
      ) : null}
    </View>
  );
}

/** The plain front-view figure. Decorative: the numbers beside it carry the meaning. */
export function Silhouette({ outline, caption }: { outline: Outline; caption: string }) {
  return (
    <View style={styles.figure}>
      <Svg width={outline.width} height={outline.height} viewBox={`0 0 ${outline.width} ${outline.height}`}>
        {outline.arms.map((a, k) => (
          <Line
            key={k}
            x1={a.x1}
            y1={a.y1}
            x2={a.x2}
            y2={a.y2}
            stroke={colors.sage}
            strokeWidth={a.width}
            strokeLinecap="round"
          />
        ))}
        <Path d={outline.path} fill={colors.sage} />
        <Circle cx={outline.head.cx} cy={outline.head.cy} r={outline.head.r} fill={colors.sage} />
      </Svg>
      <Text style={styles.figureCaption}>{caption}</Text>
    </View>
  );
}

const CHART = { width: 280, height: 120, pad: 12, minSteps: 2000, maxSteps: 12000 };

/** The published steps and risk curve with the person's average marked. */
export function StepsCurve({ average, label }: { average: number; label: string }) {
  const x = (steps: number) =>
    CHART.pad +
    ((Math.min(CHART.maxSteps, Math.max(CHART.minSteps, steps)) - CHART.minSteps) / (CHART.maxSteps - CHART.minSteps)) *
      (CHART.width - CHART.pad * 2);
  const y = (risk: number) => CHART.pad + (1 - (risk - 0.4) / 0.65) * (CHART.height - CHART.pad * 2);
  const points = [CHART.minSteps, ...STEPS_CURVE.map(([s]) => s), CHART.maxSteps]
    .map((s) => `${x(s).toFixed(1)},${y(relativeRiskAt(s)).toFixed(1)}`)
    .join(' ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.chart}>
      <Svg width={CHART.width} height={CHART.height} viewBox={`0 0 ${CHART.width} ${CHART.height}`}>
        <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinejoin="round" />
        <Circle cx={x(average)} cy={y(relativeRiskAt(average))} r={7} fill={colors.surface} stroke={colors.primary} strokeWidth={3} />
      </Svg>
    </View>
  );
}

export const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  titleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...font.bold, fontSize: 19, color: colors.textPrimary, flex: 1 },
  body: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 8 },
  strong: { ...font.semibold, fontSize: 16, lineHeight: 23, color: colors.textPrimary, marginBottom: 6 },
  source: { ...font.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2, marginBottom: 8 },
  error: { ...font.medium, fontSize: 14, color: colors.error, marginTop: 6 },
  field: { marginBottom: 10 },
  fieldLabel: { ...font.semibold, fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  input: {
    ...font.medium,
    minHeight: 48,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  card: { marginBottom: 14 },
  reportRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  reportLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  reportLabel: { ...font.medium, fontSize: 15, color: colors.textSecondary, flexShrink: 1 },
  reportValue: { ...font.bold, fontSize: 16, color: colors.textPrimary, flexShrink: 1, textAlign: 'right' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.surfaceSecondary, marginTop: 8, overflow: 'hidden' },
  band: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.primarySoft },
  marker: { position: 'absolute', top: 0, bottom: 0, width: 4, marginLeft: -2, backgroundColor: colors.primary },
  bandText: { ...font.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  figures: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  figure: { alignItems: 'center' },
  figureCaption: { ...font.semibold, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  chart: { alignItems: 'center', marginVertical: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  stepperBtn: { width: 96 },
  stepperText: { ...font.semibold, flex: 1, fontSize: 15, color: colors.textPrimary, textAlign: 'center' },
});
