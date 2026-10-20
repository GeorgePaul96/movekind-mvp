import type { Exercise } from '@/types';

/**
 * The exercise library, bundled with the app (local-first — no server).
 *
 * SAFETY CONTRACT (docs/exercise-source-review.md):
 * - Every exercise the app shows cites an authoritative public source. Instructions are
 *   written in our own words from that source — we link to it, we never copy it.
 * - Anything unsourced or awaiting physiotherapist review is `review: 'pending_review'`
 *   and is NEVER shown (see ACTIVE_EXERCISES). A source must describe the same variant
 *   we teach: a high-impact source does not back a low-impact version.
 * - `cautions` carry the source's own "skip this if…" advice and show in the player.
 *
 * Ids are STABLE: per-exercise stats are keyed by them. Never renumber; add new exercises
 * with the next free index in their category (e.g. ex-regulate-7).
 */

const SRC = {
  nhsStrength: { name: 'NHS', url: 'https://www.nhs.uk/live-well/exercise/strength-exercises/' },
  nhsFlex: { name: 'NHS', url: 'https://www.nhs.uk/live-well/exercise/flexibility-exercises/' },
  nhsBreathing: {
    name: 'NHS',
    url: 'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/',
  },
  nhsInformBack: {
    name: 'NHS inform',
    url: 'https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/neck-and-back-problems-and-conditions/exercises-for-back-pain/',
  },
  nhsInformBalance: {
    name: 'NHS inform',
    url: 'https://www.nhsinform.scot/healthy-living/preventing-falls/keeping-well/strength-and-balance-exercises/',
  },
  mayoBack: {
    name: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/back-pain/art-20546859',
  },
  mayoCore: {
    name: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/core-strength/art-20546851',
  },
  mayoStretch: {
    name: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/stretching/art-20546848',
  },
  mayoUpperBody: {
    name: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/multimedia/shoulder-stretches/vid-20084699',
  },
  clevelandLegsUp: {
    name: 'Cleveland Clinic',
    url: 'https://health.clevelandclinic.org/benefits-of-legs-up-the-wall',
  },
  aceJab: {
    name: 'American Council on Exercise',
    url: 'https://www.acefitness.org/resources/everyone/blog/7178/kick-your-way-to-fitness-over-the-holidays-with-this-high-intensity-kickboxing-workout/',
  },
} as const;

const base = { created_at: '2026-01-01T00:00:00.000Z', is_premium: false } as const;

export const EXERCISES: Exercise[] = [
  // ---- regulate: calm, seated or standing ----------------------------------
  {
    ...base,
    id: 'ex-regulate-1',
    name: 'Slow belly breathing',
    category: 'regulate',
    base_difficulty: 1,
    cues: [
      'Sit or stand comfortably and loosen anything tight',
      'Breathe in gently through your nose for a count of 5',
      'Breathe out through your mouth for a count of 5',
      "Let the breath reach your belly without forcing it. It's fine not to reach 5 at first",
    ],
    illustration_ref: 'regulate_slow_breathing',
    source: SRC.nhsBreathing,
    cautions: ['If you feel dizzy, go back to breathing normally for a moment.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-regulate-2',
    name: 'Trunk turns',
    category: 'regulate',
    base_difficulty: 1,
    cues: [
      'Stand with feet hip-width apart, shoulders relaxed',
      'Fold your arms gently in front of you and stand tall',
      'Slowly look over one shoulder, keeping your hips facing forward',
      'Come back to the middle, then turn the other way',
    ],
    illustration_ref: 'regulate_trunk_turns',
    source: SRC.nhsInformBalance,
    cautions: ['Hold a sturdy chair or counter if you feel unsteady.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-regulate-3',
    name: 'Neck turns',
    category: 'regulate',
    base_difficulty: 1,
    cues: [
      'Sit upright with your shoulders down',
      'Slowly turn your head towards one shoulder, as far as is comfortable',
      'Pause, then return to the middle',
      'Turn towards the other shoulder. Keep it slow, with no circling or rolling',
    ],
    illustration_ref: 'regulate_neck_turns',
    source: SRC.nhsFlex,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-regulate-4',
    name: 'Neck side stretch',
    category: 'regulate',
    base_difficulty: 1,
    cues: [
      'Sit upright and hold one shoulder gently down with the opposite hand',
      'Tilt your head away from that shoulder until you feel a gentle stretch',
      'Hold for about 5 seconds, then come back to the middle',
      'Switch sides',
    ],
    illustration_ref: 'regulate_neck_side_stretch',
    source: SRC.nhsFlex,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-regulate-5',
    name: 'Chest stretch',
    category: 'regulate',
    base_difficulty: 1,
    cues: [
      'Sit or stand tall and gently squeeze your shoulder blades together',
      'Place your hands behind your head',
      'Draw your elbows back until you feel a gentle stretch across your chest',
      'Hold for 15 to 30 seconds, breathing freely, then relax',
    ],
    illustration_ref: 'regulate_chest_stretch',
    source: SRC.mayoUpperBody,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-regulate-6',
    name: 'Cat-cow',
    category: 'regulate',
    base_difficulty: 1,
    cues: [
      'Start on your hands and knees',
      'Slowly round your back up, tucking your chin in',
      'Then let your back gently dip as you lift your head',
      'Move slowly and only as far as is comfortable',
    ],
    illustration_ref: 'regulate_cat_cow',
    source: SRC.mayoBack,
    cautions: ['Put a cushion under your knees if they are sensitive.'],
    review: 'sourced',
  },

  // ---- mobilize: gentle range of movement ------------------------------------
  {
    ...base,
    id: 'ex-mobilize-1',
    name: 'Seated rotation stretch',
    category: 'mobilize',
    base_difficulty: 1,
    cues: [
      'Sit on a sturdy chair without arms, feet flat',
      'Cross one leg over the other',
      'Rest the opposite elbow against the outside of the raised knee and turn gently towards it',
      'Hold for about 10 seconds, then switch sides',
    ],
    illustration_ref: 'mobilize_seated_rotation',
    source: SRC.mayoBack,
    cautions: ['Turn only as far as is comfortable. Skip it if twisting hurts your back.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-mobilize-2',
    name: 'Pelvic tilt',
    category: 'mobilize',
    base_difficulty: 1,
    cues: [
      'Lie on your back on a bed or mat, knees bent and feet flat',
      'Gently flatten your lower back into the surface by tightening your tummy',
      'Hold for a few seconds, then let your back ease back to normal',
      'Keep breathing throughout',
    ],
    illustration_ref: 'mobilize_pelvic_tilt',
    source: SRC.nhsInformBack,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-mobilize-3',
    name: 'Calf stretch at a wall',
    category: 'mobilize',
    base_difficulty: 1,
    cues: [
      'Stand facing a wall with your hands on it',
      'Step one leg back, keeping it straight with the heel down',
      'Bend the front knee until you feel a stretch in the back calf',
      'Hold, then switch legs. Keep both feet flat',
    ],
    illustration_ref: 'mobilize_calf_wall',
    source: SRC.nhsFlex,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-mobilize-4',
    name: 'Cross-body shoulder stretch',
    category: 'mobilize',
    base_difficulty: 1,
    cues: [
      'Sit or stand tall',
      'Bring one arm across your body at chest height',
      'Hold it there gently with your other arm',
      "Hold for about 30 seconds, then switch arms. Don't bounce",
    ],
    illustration_ref: 'mobilize_cross_body_shoulder',
    source: SRC.mayoStretch,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-mobilize-5',
    name: 'Towel shoulder stretch',
    category: 'mobilize',
    base_difficulty: 1,
    cues: [
      'Hold a rolled towel over one shoulder, other hand gripping it behind your back',
      'Gently pull upward with the top hand',
      'Feel the stretch as your lower hand is drawn up your back',
      'Hold for about 30 seconds, then switch hands',
    ],
    illustration_ref: 'mobilize_towel_shoulder',
    source: SRC.mayoStretch,
    cautions: ['Skip this if you have a shoulder injury.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-mobilize-6',
    name: 'Sideways bend',
    category: 'mobilize',
    base_difficulty: 1,
    cues: [
      'Stand with feet hip-width apart, arms by your sides',
      'Slide one hand slowly down the side of your leg',
      'Feel the stretch along the opposite side, only as far as is comfortable',
      'Come back up slowly and switch sides',
    ],
    illustration_ref: 'mobilize_sideways_bend',
    source: SRC.nhsFlex,
    review: 'sourced',
  },

  // ---- strengthen: supported, controlled -------------------------------------
  {
    ...base,
    id: 'ex-strengthen-1',
    name: 'Mini-squats',
    category: 'strengthen',
    base_difficulty: 1,
    cues: [
      'Hold the back of a sturdy chair, feet hip-width apart',
      'Bend your knees slowly, keeping your back straight',
      'Only go a little way down, then stand back up',
      'Do 5 slowly, rest, and repeat while the timer runs',
    ],
    illustration_ref: 'strengthen_mini_squats',
    source: SRC.nhsStrength,
    cautions: ['Use a sturdy chair that will not slip or roll.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-strengthen-2',
    name: 'Bridge',
    category: 'strengthen',
    base_difficulty: 1,
    cues: [
      'Lie on your back, knees bent, feet flat',
      'Tighten your tummy and bottom muscles',
      'Lift your hips until your knees, hips and shoulders make a straight line',
      'Hold for three slow breaths, then lower. Rest between lifts',
    ],
    illustration_ref: 'strengthen_bridge',
    source: SRC.mayoCore,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-strengthen-3',
    name: 'Wall press-up',
    category: 'strengthen',
    base_difficulty: 1,
    cues: [
      'Stand an arm’s length from a wall, hands on it at chest height',
      'Keeping your back straight, bend your arms to bring your chest towards the wall',
      'Push back to the start',
      'Do 5 slowly, rest, and repeat while the timer runs',
    ],
    illustration_ref: 'strengthen_wall_pressup',
    source: SRC.nhsStrength,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-strengthen-4',
    name: 'Bird dog',
    category: 'strengthen',
    base_difficulty: 1,
    cues: [
      'Start on hands and knees, hands under shoulders, neck in line with your back',
      'Tighten your tummy and reach one arm straight ahead; hold for three breaths',
      'Lower it and do the other arm',
      'Then try one leg straight back at a time, keeping your hips level',
    ],
    illustration_ref: 'strengthen_bird_dog',
    source: SRC.mayoCore,
    cautions: ['Put a cushion under your knees if they are sensitive.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-strengthen-5',
    name: 'Sit-to-stand',
    category: 'strengthen',
    base_difficulty: 1,
    cues: [
      'Sit near the front of a sturdy chair, feet flat and slightly back',
      'Lean forward a little and stand up using your legs',
      'Slowly sit back down with control',
      'Do up to 5, rest, and repeat while the timer runs',
    ],
    illustration_ref: 'strengthen_sit_to_stand',
    source: SRC.nhsStrength,
    cautions: ['Use a solid chair without wheels that will not slip.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-strengthen-6',
    name: 'Sideways leg lift',
    category: 'strengthen',
    base_difficulty: 1,
    cues: [
      'Stand tall holding the back of a sturdy chair',
      'Slowly lift one leg out to the side, keeping your body upright',
      'Lower it with control',
      'Do 5 on each leg, rest, and repeat while the timer runs',
    ],
    illustration_ref: 'strengthen_side_leg_lift',
    source: SRC.nhsStrength,
    review: 'sourced',
  },

  // ---- move: gentle cardio, low impact ---------------------------------------
  {
    ...base,
    id: 'ex-move-1',
    name: 'Easy marching',
    category: 'move',
    base_difficulty: 1,
    cues: [
      'Stand with feet hip-width apart, shoulders relaxed',
      'Walk on the spot at an easy pace',
      'Land on the ball of your foot, then the heel',
      'Hold a chair if you like; let go when you feel steady',
    ],
    illustration_ref: 'move_easy_marching',
    source: SRC.nhsInformBalance,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-move-2',
    name: 'Shadow boxing',
    category: 'move',
    base_difficulty: 1,
    cues: [
      'Stand with soft knees, fists near your chin',
      'Punch one hand straight out at an easy pace',
      "Keep the elbow slightly bent. Don't lock it",
      'Pull back and alternate hands. Light and relaxed, not fast',
    ],
    illustration_ref: 'move_shadow_boxing',
    source: SRC.aceJab,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-move-3',
    name: 'Step-out jacks',
    category: 'move',
    base_difficulty: 1,
    cues: [
      'Stand tall, arms by your sides',
      'Step one foot out while raising your arms',
      'Step back and lower your arms',
      'Alternate sides',
    ],
    illustration_ref: 'move_step_jacks',
    // No source found for the low-impact (stepping) version — hidden until a physio approves.
    review: 'pending_review',
  },
  {
    ...base,
    id: 'ex-move-4',
    name: 'Cardio step-back',
    category: 'move',
    base_difficulty: 1,
    cues: [
      'Start with soft knees',
      'Tap one foot back, then return to centre',
      'Tap the other foot back, then return to centre',
      'Swing your arms in rhythm',
    ],
    illustration_ref: 'move_cardio_stepback',
    // No authoritative source found — hidden until a physio approves.
    review: 'pending_review',
  },
  {
    ...base,
    id: 'ex-move-5',
    name: 'Knee lifts',
    category: 'move',
    base_difficulty: 1,
    cues: [
      'Start with easy marching on the spot',
      'As you warm up, lift your knees a little higher',
      'Keep it a purposeful march, not a run',
      'Hold a chair or counter if you need support',
    ],
    illustration_ref: 'move_knee_lifts',
    source: SRC.nhsInformBalance,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-move-6',
    name: 'Side-to-side steps',
    category: 'move',
    base_difficulty: 1,
    cues: [
      'Stand tall, feet hip-width apart, holding something firm',
      'Step one foot out to the side, toe down before the heel',
      'Bring the other foot to follow, keeping a gap between your feet',
      'Take about 10 steps one way, then come back',
    ],
    illustration_ref: 'move_side_steps',
    source: SRC.nhsInformBalance,
    review: 'sourced',
  },

  // ---- downshift: lying down, winding down -----------------------------------
  {
    ...base,
    id: 'ex-downshift-1',
    name: 'Legs up the wall',
    category: 'downshift',
    base_difficulty: 1,
    cues: [
      'Sit sideways next to a wall',
      'Lie back and swing your legs up the wall',
      'Let your arms rest at your sides',
      'Breathe slowly and stay as long as it feels comfortable',
    ],
    illustration_ref: 'downshift_legs_up_wall',
    source: SRC.clevelandLegsUp,
    cautions: [
      'Skip this if you have glaucoma or another eye-pressure condition.',
      'Skip it, or check with your doctor first, if you have a condition that causes fluid retention.',
    ],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-downshift-2',
    name: "Child's pose",
    category: 'downshift',
    base_difficulty: 1,
    cues: [
      'Kneel, then sit back towards your heels',
      'Walk your hands forward and lower your chest',
      'Rest your forehead on the floor or a cushion',
      'Breathe slowly',
    ],
    illustration_ref: 'downshift_childs_pose',
    // Only physio-practice sources found — hidden until a physio approves.
    review: 'pending_review',
  },
  {
    ...base,
    id: 'ex-downshift-3',
    name: 'Knee rolls',
    category: 'downshift',
    base_difficulty: 1,
    cues: [
      'Lie on your back on a bed or mat, knees bent and pointing up',
      'Slowly let both knees roll to one side',
      'Hold for a few seconds, then bring them back to the middle',
      'Roll to the other side. Move gently',
    ],
    illustration_ref: 'downshift_knee_rolls',
    source: SRC.nhsInformBack,
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-downshift-4',
    name: 'Knee-to-chest stretch',
    category: 'downshift',
    base_difficulty: 1,
    cues: [
      'Lie on your back, knees bent, feet flat',
      'Use both hands to bring one knee gently towards your chest',
      'Hold for about 5 seconds, then lower and switch legs',
      'Keep your lower back relaxed against the floor',
    ],
    illustration_ref: 'downshift_knee_to_chest',
    source: SRC.mayoBack,
    cautions: ['Skip this if you have osteoporosis.'],
    review: 'sourced',
  },
  {
    ...base,
    id: 'ex-downshift-5',
    name: 'Lying slow breathing',
    category: 'downshift',
    base_difficulty: 1,
    cues: [
      'Lie on your back, arms slightly away from your sides, palms up',
      'Breathe in gently through your nose for a count of 5',
      'Breathe out through your mouth for a count of 5',
      'Let your body feel heavy. Nothing to do but breathe',
    ],
    illustration_ref: 'downshift_lying_breathing',
    source: SRC.nhsBreathing,
    review: 'sourced',
  },
];

/** The only exercises the app may show or compose from. */
export const ACTIVE_EXERCISES: Exercise[] = EXERCISES.filter((e) => e.review === 'sourced');

/** Looks up ANY exercise (including retired/pending ones, so old history still renders). */
export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
