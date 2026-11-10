import { BODY_COPY, INSIGHTS_COPY } from '@/constants/bodyCopy';
import { SOURCES, type SourceId } from '@/constants/sources';
import { BODY_FAT_ERROR } from '@/domain/body/composition';
import { BURN_ERROR } from '@/domain/body/energy';
import type { BodySummary } from '@/domain/body/summary';
import { lengthUnit, tidy, toDisplayLength, toDisplayWeight, weightUnit, type Units } from '@/domain/body/units';
import type { Pattern } from '@/domain/insights/patterns';
import type { BodyProfile, CheckIn, MealLog, Measurement, PulseLog, SleepLog, WaterLog, Workout } from '@/types';

/**
 * The exported report: a plain text summary and a full JSON copy. Pure.
 * Body numbers appear only when the person has the Body section switched on.
 */
export interface ReportInput {
  name: string | null;
  checkIns: CheckIn[];
  water: WaterLog[];
  workouts: Workout[];
  meals: MealLog[];
  sleep: SleepLog[];
  patterns: Pattern[];
  bodyEnabled: boolean;
  units: Units;
  body?: {
    profile: BodyProfile | null;
    measurements: Measurement[];
    pulses: PulseLog[];
    summary: BodySummary;
    sleepBalance: { hoursBehind: number; nights: number } | null;
    stepsHealth: { average: number; relativeRisk: number; plateau: [number, number] } | null;
  };
}

const R = INSIGHTS_COPY.report;
const round10 = (n: number) => Math.round(n / 10) * 10;

export function buildReport(data: ReportInput, now: Date): { text: string; json: string } {
  const lines: string[] = [];
  const used = new Set<SourceId>();
  const section = (title: string) => lines.push('', title.toUpperCase());

  lines.push(data.name ? `${R.heading}: ${data.name}` : R.heading);
  lines.push(R.made(now.toLocaleDateString()));

  section(R.logs);
  const L = R.logLabels;
  lines.push(`${L.checkIns}: ${data.checkIns.length}`);
  lines.push(`${L.water}: ${data.water.length}`);
  lines.push(`${L.workouts}: ${data.workouts.length}`);
  lines.push(`${L.meals}: ${data.meals.length}`);
  lines.push(`${L.sleep}: ${data.sleep.length}`);

  if (data.patterns.length) {
    section(INSIGHTS_COPY.patternsTitle);
    for (const p of data.patterns) lines.push(INSIGHTS_COPY.patterns[p.kind][p.direction]);
  }

  const body = data.bodyEnabled ? data.body : undefined;
  if (body) {
    const { summary } = body;
    const w = (kg: number) => `${tidy(toDisplayWeight(kg, data.units))} ${weightUnit(data.units)}`;
    const len = (cm: number) => `${tidy(toDisplayLength(cm, data.units))} ${lengthUnit(data.units)}`;
    const c = summary.composition;
    if (c) {
      section(R.body);
      const rows = BODY_COPY.rows;
      lines.push(`${rows.weight}: ${w(c.weight_kg)}`);
      lines.push(`${rows.bmi}: ${tidy(c.bmi)}`);
      used.add('bmi');
      if (c.bodyFatPct != null && c.fatMass_kg != null && c.leanMass_kg != null) {
        lines.push(`${rows.bodyFat}: ${BODY_COPY.plusMinus(`${tidy(c.bodyFatPct)}%`, `${BODY_FAT_ERROR} points`)}`);
        lines.push(`${rows.fatMass}: ${w(c.fatMass_kg)}`);
        lines.push(`${rows.leanMass}: ${w(c.leanMass_kg)}`);
        if (c.ffmi != null) lines.push(`${rows.ffmi}: ${tidy(c.ffmi)}`);
        used.add('navy');
      }
      if (c.waistToHeight != null) {
        lines.push(`${rows.waistToHeight}: ${tidy(c.waistToHeight, 2)}`);
        used.add('waistToHeight');
      }
      if (summary.latest?.waist_cm) lines.push(`${BODY_COPY.waist(lengthUnit(data.units))}: ${len(summary.latest.waist_cm)}`);
      if (summary.burn) {
        lines.push(`${rows.resting}: ${BODY_COPY.kcal(round10(summary.burn.resting))}`);
        lines.push(
          `${rows.daily}: ${BODY_COPY.kcalRange(round10(summary.burn.daily * (1 - BURN_ERROR)), round10(summary.burn.daily * (1 + BURN_ERROR)))}`,
        );
        used.add('mifflin');
        used.add('activity');
      }
    }

    const proj = summary.projection;
    if (proj) {
      section(R.pace);
      if (proj.status === 'too-fast') lines.push(BODY_COPY.tooFast);
      else if (proj.status === 'steady') lines.push(BODY_COPY.steady);
      else {
        proj.central.forEach((pt, k) => {
          const lo = Math.min(proj.low[k].weight_kg, proj.high[k].weight_kg);
          const hi = Math.max(proj.low[k].weight_kg, proj.high[k].weight_kg);
          lines.push(`${BODY_COPY.later(pt.weeks)}: ${BODY_COPY.about(w(pt.weight_kg), w(lo), w(hi))}, ${tidy(pt.bodyFatPct)}% ${BODY_COPY.rows.bodyFat.toLowerCase()}`);
        });
        lines.push(BODY_COPY.ignores);
        if (summary.bodyFat?.estimated) used.add('deurenberg');
      }
      used.add('hall');
    }

    if (body.sleepBalance || body.stepsHealth) section(R.insights);
    if (body.sleepBalance) {
      const s = body.sleepBalance;
      lines.push(s.hoursBehind > 0 ? INSIGHTS_COPY.sleepBehind(s.hoursBehind, s.nights) : INSIGHTS_COPY.sleepLevel(s.nights));
      used.add('sleep');
    }
    if (body.stepsHealth) {
      lines.push(INSIGHTS_COPY.stepsAverage(body.stepsHealth.average));
      lines.push(INSIGHTS_COPY.stepsRisk(Math.round((1 - body.stepsHealth.relativeRisk) * 100)));
      lines.push(INSIGHTS_COPY.stepsNote);
      used.add('steps');
    }

    if (used.size) {
      section(R.sources);
      for (const id of used) lines.push(SOURCES[id].cite);
      lines.push(R.disclaimer);
    }
  }

  const json = JSON.stringify(
    {
      exported_at: now.toISOString(),
      name: data.name,
      check_ins: data.checkIns,
      water: data.water,
      workouts: data.workouts,
      meals: data.meals,
      sleep: data.sleep,
      ...(body ? { body: body.profile, measurements: body.measurements, pulse: body.pulses } : {}),
    },
    null,
    2,
  );

  return { text: lines.join('\n').trim(), json };
}
