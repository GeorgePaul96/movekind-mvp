/**
 * Where every number in the opt-in Body section and Insights comes from. Shown under
 * each number as "Source: ...". These are citations, not copy: keep them exact.
 */
export interface Source {
  /** Short name shown in the app. */
  label: string;
  /** Full citation, used in the exported report. */
  cite: string;
}

export const SOURCES = {
  navy: {
    label: 'US Navy circumference method (Hodgdon and Beckett, 1984)',
    cite: 'Hodgdon JA, Beckett MB. Prediction of percent body fat for U.S. Navy men and women from body circumferences and height. Naval Health Research Center reports 84-11 and 84-29, 1984.',
  },
  deurenberg: {
    label: 'Body fat from BMI (Deurenberg and others, 1991)',
    cite: 'Deurenberg P, Weststrate JA, Seidell JC. Body mass index as a measure of body fatness: age- and sex-specific prediction formulas. British Journal of Nutrition, 1991.',
  },
  bmi: {
    label: 'World Health Organization BMI reference range',
    cite: 'World Health Organization. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894, 2000.',
  },
  waistToHeight: {
    label: 'NICE guidance on waist to height ratio (2022)',
    cite: 'National Institute for Health and Care Excellence. Obesity: identification, assessment and management (CG189), 2022 update.',
  },
  mifflin: {
    label: 'Mifflin-St Jeor equation (1990)',
    cite: 'Mifflin MD, St Jeor ST, and others. A new predictive equation for resting energy expenditure in healthy individuals. American Journal of Clinical Nutrition, 1990.',
  },
  activity: {
    label: 'ACSM walking equation and the 2011 Compendium of Physical Activities',
    cite: 'American College of Sports Medicine metabolic equations; Ainsworth BE and others. 2011 Compendium of Physical Activities. Medicine and Science in Sports and Exercise, 2011. Values used are approximate.',
  },
  hall: {
    label: 'Hall body weight model with the Forbes rule (2007, 2008)',
    cite: "Hall KD. Body fat and fat-free mass inter-relationships: Forbes's theory revisited. British Journal of Nutrition, 2007. Hall KD. What is the required energy deficit per unit weight loss? International Journal of Obesity, 2008.",
  },
  sleep: {
    label: 'Adult sleep recommendation (AASM and Sleep Research Society, 2015)',
    cite: 'Watson NF and others. Recommended amount of sleep for a healthy adult: a joint consensus statement of the American Academy of Sleep Medicine and Sleep Research Society. Sleep, 2015.',
  },
  steps: {
    label: 'Daily steps and long-term health (Paluch and others, 2022)',
    cite: 'Paluch AE and others. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. The Lancet Public Health, 2022.',
  },
  fitness: {
    label: 'HUNT non-exercise fitness model (Nes and others, 2011)',
    cite: 'Nes BM and others. Estimating VO2peak from a nonexercise prediction model: the HUNT Study, Norway. Medicine and Science in Sports and Exercise, 2011.',
  },
  breathing: {
    label: 'NHS breathing exercises for stress',
    cite: 'NHS. Breathing exercises for stress. nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress',
  },
  goodThings: {
    label: 'The "three good things" exercise (Seligman and others, 2005)',
    cite: 'Seligman MEP, Steen TA, Park N, Peterson C. Positive psychology progress: empirical validation of interventions. American Psychologist, 2005.',
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
