import { supabase } from './supabase';
import { cacheKeys, writeCache } from './cache';
import { FALLBACK_INSIGHTS } from '@/constants/copy';
import { pickRandom } from '@/utils/format';
import type { Activity, AIInsight, ComputedScores, Reflection } from '@/types';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

interface BuildPromptInput {
  scores: ComputedScores;
  recentActivities: Activity[];
  latestReflection: Reflection | null;
}

function buildPrompt(input: BuildPromptInput): string {
  const acts = input.recentActivities.slice(0, 6).map((a) =>
    `- ${a.type}, ${a.duration_minutes} min, effort ${a.effort}/10`,
  );
  const reflection = input.latestReflection
    ? `Reflection — energy ${input.latestReflection.energy}/10, recovery ${input.latestReflection.recovery}/10, mood ${input.latestReflection.mood}/10`
    : 'No reflection logged yet.';

  return `You are a calm, kind movement coach. Speak in two short sentences.
Use the data below to give one specific observation and one gentle suggestion.
No guilt, no streak-shaming, no exclamation marks. Avoid medical claims.

Scores (0-100): consistency ${input.scores.consistency}, strength ${input.scores.strength}, endurance ${input.scores.endurance}, recovery ${input.scores.recovery}, overall ${input.scores.overall}.
Recent activities:
${acts.join('\n') || '(none logged this week)'}
${reflection}`;
}

async function callOpenAI(prompt: string): Promise<string | null> {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 160,
        messages: [
          {
            role: 'system',
            content:
              'You are a kind, calm movement coach. You never use guilt-based language.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Generate an insight, persist it, and return it.
 * Always succeeds — falls back to a curated message when OpenAI is unavailable.
 */
export async function generateAndStoreInsight(
  userId: string,
  input: BuildPromptInput,
): Promise<AIInsight> {
  const aiText = await callOpenAI(buildPrompt(input));
  const body = aiText ?? pickRandom(FALLBACK_INSIGHTS);
  const source: AIInsight['source'] = aiText ? 'openai' : 'fallback';

  const { data, error } = await supabase
    .from('ai_insights')
    .insert({ user_id: userId, body, source })
    .select('*')
    .single();

  const insight: AIInsight =
    !error && data
      ? (data as AIInsight)
      : {
          id: 'local-' + Date.now(),
          user_id: userId,
          body,
          source,
          created_at: new Date().toISOString(),
        };

  await writeCache(cacheKeys.insight, insight);
  return insight;
}

export async function getLatestInsight(userId: string): Promise<AIInsight | null> {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as AIInsight) ?? null;
}
