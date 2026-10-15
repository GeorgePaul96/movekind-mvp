/**
 * Records MoveKind's guide voice with Kokoro (Apache-2.0) — run on a dev machine, never in the app.
 *
 *   npm run voice:generate          # record new/changed lines only
 *   npm run voice:generate -- --all # re-record everything
 *
 * For every line in allSpokenLines(ACTIVE_EXERCISES):
 *   1. synthesize with Kokoro (voice af_heart, speed 0.9)
 *   2. QA: reject silent / truncated / dropout clips (Kokoro can fall silent on rare phrases)
 *   3. trim edge silence, normalize peak, encode AAC mono (ffmpeg-static, dev-only tool)
 *   4. write assets/voice/<hash>.m4a and src/data/voiceClips.generated.ts
 * Then writes .voice-review/review.m4a — every clip back to back — for a human listen-through.
 *
 * Licenses: Kokoro model + kokoro-js Apache-2.0. ffmpeg-static (GPL) and the espeak-ng
 * phonemizer (GPL) run only here to produce audio; neither ships inside the app.
 */
import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ACTIVE_EXERCISES } from '../../src/data/exercises';
import { allSpokenLines } from '../../src/domain/sessions/voiceScript';

const VOICE = 'af_heart';
const SPEED = 0.9;
const VOICE_ID = `kokoro:${VOICE}@${SPEED}`;

const ROOT = path.resolve(__dirname, '../..');
const ASSET_DIR = path.join(ROOT, 'assets', 'voice');
const MANIFEST = path.join(ROOT, 'src', 'data', 'voiceClips.generated.ts');
const REVIEW_DIR = path.join(ROOT, '.voice-review');
// Windows' 260-char path limit breaks the model cache under long project paths.
env.cacheDir = path.join(os.tmpdir(), 'kokoro-cache');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mkvoice-'));

/** FNV-1a 32-bit: stable, dependency-free file names per (voice, text). */
function clipId(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of `${VOICE_ID}|${text}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

interface Qa { seconds: number; longestSilence: number; peak: number }

function analyse(samples: Float32Array, rate: number): Qa {
  const win = Math.floor(rate * 0.1);
  let peak = 0, run = 0, longest = 0, acc = 0, n = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i]!;
    peak = Math.max(peak, Math.abs(v));
    acc += v * v;
    if (++n === win) {
      if (Math.sqrt(acc / win) < 0.004) longest = Math.max(longest, ++run * 0.1);
      else run = 0;
      acc = 0; n = 0;
    }
  }
  return { seconds: samples.length / rate, longestSilence: longest, peak };
}

function problems(text: string, qa: Qa): string[] {
  const words = text.split(/\s+/).length;
  const expected = words / 2.3; // ~2.3 words/s at speed 0.9
  const out: string[] = [];
  if (qa.peak < 0.05) out.push('silent');
  if (qa.seconds < expected * 0.45) out.push(`too short (${qa.seconds.toFixed(1)}s for ${words} words)`);
  if (qa.seconds > expected * 2.6 + 1) out.push(`too long (${qa.seconds.toFixed(1)}s)`);
  if (qa.longestSilence > 1.2) out.push(`dropout (${qa.longestSilence.toFixed(1)}s of silence)`);
  return out;
}

/** Trim quiet edges (keep 120 ms), normalize peak to -1 dBFS, return 16-bit PCM WAV bytes. */
function toWav(samples: Float32Array, rate: number): Buffer {
  const quiet = (v: number) => Math.abs(v) < 0.01;
  let start = 0, end = samples.length;
  while (start < end && quiet(samples[start]!)) start++;
  while (end > start && quiet(samples[end - 1]!)) end--;
  const pad = Math.floor(rate * 0.12);
  start = Math.max(0, start - pad);
  end = Math.min(samples.length, end + pad);
  const body = samples.subarray(start, end);
  let peak = 0;
  for (const v of body) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? 0.89 / peak : 1;
  const pcm = Buffer.alloc(body.length * 2);
  body.forEach((v, i) => pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * gain * 32767))), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

function ffmpeg(args: string[]) {
  execFileSync(ffmpegPath as unknown as string, ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
}

async function main() {
  const all = process.argv.includes('--all');
  const lines = allSpokenLines(ACTIVE_EXERCISES);
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  fs.mkdirSync(REVIEW_DIR, { recursive: true });

  console.log(`Voice ${VOICE_ID} — ${lines.length} lines`);
  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });

  const failures: string[] = [];
  const reviewWavs: string[] = [];
  for (const [i, text] of lines.entries()) {
    const id = clipId(text);
    const out = path.join(ASSET_DIR, `${id}.m4a`);
    const wav = path.join(TMP, `${id}.wav`);
    if (!all && fs.existsSync(out)) {
      ffmpeg(['-i', out, '-ac', '1', '-ar', '24000', wav]); // for the review file only
      reviewWavs.push(wav);
      continue;
    }
    // Kokoro occasionally misfires on a phrase: retry once before failing the line.
    let samples: Float32Array | null = null, rate = 24000, issues: string[] = [];
    for (let attempt = 1; attempt <= 2 && !samples; attempt++) {
      const audio = await tts.generate(text, { voice: VOICE, speed: SPEED });
      const qa = analyse(audio.audio, audio.sampling_rate);
      issues = problems(text, qa);
      if (issues.length === 0) { samples = audio.audio; rate = audio.sampling_rate; }
    }
    if (!samples) {
      failures.push(`"${text}": ${issues.join(', ')}`);
      continue;
    }
    fs.writeFileSync(wav, toWav(samples, rate));
    ffmpeg(['-i', wav, '-ac', '1', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', out]);
    reviewWavs.push(wav);
    console.log(`[${i + 1}/${lines.length}] ${id}  ${text}`);
  }

  if (failures.length) {
    console.error(`\n${failures.length} line(s) failed QA — not written. Reword or retry:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  // Manifest: text → bundled asset. Remove clips nothing references any more.
  const keep = new Set(lines.map((t) => `${clipId(t)}.m4a`));
  for (const f of fs.readdirSync(ASSET_DIR)) if (f.endsWith('.m4a') && !keep.has(f)) fs.unlinkSync(path.join(ASSET_DIR, f));
  const entries = lines
    .map((t) => `  ${JSON.stringify(t)}: require('../../assets/voice/${clipId(t)}.m4a'),`)
    .join('\n');
  fs.writeFileSync(
    MANIFEST,
    `// AUTO-GENERATED by scripts/voice/generate.ts — do not edit. Run \`npm run voice:generate\`.\n` +
      `/* eslint-disable */\n` +
      `export const VOICE_ID = '${VOICE_ID}';\n\n` +
      `/** Spoken line (exact text) → bundled audio clip. */\n` +
      `export const VOICE_CLIPS: Record<string, number> = {\n${entries}\n};\n`,
  );

  // One file to listen to everything, with a short gap between lines.
  const gap = path.join(TMP, 'gap.wav');
  ffmpeg(['-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '0.7', gap]);
  const list = path.join(TMP, 'list.txt');
  fs.writeFileSync(list, reviewWavs.flatMap((w) => [`file '${w.replace(/\\/g, '/')}'`, `file '${gap.replace(/\\/g, '/')}'`]).join('\n'));
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-ac', '1', '-c:a', 'aac', '-b:a', '64k', path.join(REVIEW_DIR, 'review.m4a')]);
  fs.writeFileSync(path.join(REVIEW_DIR, 'review-script.txt'), lines.map((t, i) => `${i + 1}. ${t}`).join('\n') + '\n');

  const bytes = fs.readdirSync(ASSET_DIR).reduce((s, f) => s + fs.statSync(path.join(ASSET_DIR, f)).size, 0);
  console.log(`\nDone: ${lines.length} clips, ${(bytes / 1024 / 1024).toFixed(2)} MB in assets/voice.`);
  console.log(`Listen to everything: ${path.join(REVIEW_DIR, 'review.m4a')} (script: review-script.txt)`);
}

main().finally(() => fs.rmSync(TMP, { recursive: true, force: true }));
