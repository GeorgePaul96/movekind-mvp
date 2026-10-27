import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { parkColors as p, stateColors, gardenColors as g } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import type { ParkLayout } from '@/domain/park/layout';
import { Bird, Duck, Tree } from '@/components/garden/Garden';
import type { ParkLight } from './ParkLayers';

interface Props {
  layout: ParkLayout;
  state: GardenState;
  light: ParkLight;
}

/** The garden's tree is drawn around (84, 198) in its own 290×250 space; this maps it onto the park. */
function placeTree(rect: { x: number; y: number; w: number; h: number }) {
  const scale = rect.h / 110;
  const tx = rect.x + rect.w / 2 - 84 * scale;
  const ty = rect.y + rect.h - 198 * scale;
  return `translate(${tx} ${ty}) scale(${scale})`;
}

/**
 * The foreground: ground, river, tree, flowerbed, grassy path and the hammock trees, all placed
 * from the shared layout. Static by design (no timers) so panning stays smooth.
 */
export function ParkWorld({ layout, state, light }: Props) {
  const { worldW: W, worldH: H, objects } = layout;
  const ground = p.ground[light];
  const river = p.river[light];
  const night = light === 'night';
  const r = objects.river;
  const riverPath =
    `M${W * 0.5} ${H * 0.5} C${W * 0.46} ${H * 0.55} ${W * 0.37} ${H * 0.57} ${r.x + r.w / 2} ${r.y + r.h / 2} ` +
    `S${W * 0.36} ${H * 0.86} ${W * 0.3} ${H * 1.02}`;
  const pathRect = objects.path;
  const walkway =
    `M${W * 0.5} ${H * 0.66} C${W * 0.56} ${H * 0.72} ${pathRect.x} ${pathRect.y} ${pathRect.x + pathRect.w / 2} ${pathRect.y + pathRect.h / 2} ` +
    `S${W * 0.7} ${H * 0.95} ${W * 0.74} ${H * 1.02}`;
  const tuftH = 6 + state.grass * 4;
  const hm = objects.hammock;
  const leftTreeX = hm.x + hm.w * 0.12;
  const rightTreeX = hm.x + hm.w * 0.88;
  const canopyY = hm.y - hm.h * 0.9;

  return (
    <Svg width={W} height={H}>
      {/* Left hill with the tree, right hill with the hammock, and the near ground. */}
      <Path d={`M0 ${H * 0.5} C${W * 0.12} ${H * 0.44} ${W * 0.3} ${H * 0.46} ${W * 0.46} ${H * 0.58} L${W * 0.46} ${H} L0 ${H}Z`} fill={ground.back} />
      <Path d={`M${W * 0.5} ${H * 0.62} C${W * 0.64} ${H * 0.5} ${W * 0.84} ${H * 0.46} ${W} ${H * 0.5} L${W} ${H} L${W * 0.5} ${H}Z`} fill={ground.back} />
      <Path d={`M0 ${H * 0.72} C${W * 0.25} ${H * 0.66} ${W * 0.6} ${H * 0.74} ${W} ${H * 0.68} L${W} ${H} L0 ${H}Z`} fill={ground.front} />

      {/* River: never dry; each glass widens it. */}
      <G testID="river">
        <Path d={riverPath} stroke={river.water} strokeWidth={14 + state.stream * 6} strokeLinecap="round" fill="none" />
        <Path d={riverPath} stroke={river.flow} strokeWidth={2} strokeDasharray="14 22" strokeLinecap="round" fill="none" opacity={0.8} />
      </G>
      {state.ducks && (
        <G transform={`translate(${r.x + r.w * 0.45} ${r.y + r.h * 0.35}) scale(1.6) translate(-168 -190)`}>
          <Duck x={168} y={190} />
          {state.stream >= 3 && <Duck x={150} y={198} />}
        </G>
      )}

      {/* Grassy walkway toward the hammock. */}
      <Path d={walkway} stroke={p.path[light]} strokeWidth={Math.max(26, W * 0.05)} strokeLinecap="round" fill="none" />

      {/* Tree on the left hill, with birds once workouts bring them. */}
      <G transform={placeTree(objects.tree)}>
        <Tree stage={state.tree} />
        {state.birds && (
          <>
            <Bird x={70} y={92} asleep={night || state.resting} />
            <Bird x={98} y={96} asleep={night || state.resting} flip />
          </>
        )}
      </G>

      {/* Two slim trees and the hammock between them. */}
      <G testID="hammock">
        {[leftTreeX, rightTreeX].map((x, i) => {
          const groundY = hm.y + hm.h;
          const crownW = hm.w * 0.2;
          const crownTop = canopyY - hm.h * 0.7;
          const crownBottom = hm.y + hm.h * 0.05;
          // A slim teardrop crown (like the Gemini art) with the trunk running up into it.
          const crown =
            `M${x} ${crownTop} C${x + crownW * 0.75} ${crownTop + (crownBottom - crownTop) * 0.35} ${x + crownW * 0.6} ${crownBottom} ${x} ${crownBottom} ` +
            `C${x - crownW * 0.6} ${crownBottom} ${x - crownW * 0.75} ${crownTop + (crownBottom - crownTop) * 0.35} ${x} ${crownTop}Z`;
          return (
            <G key={i}>
              <Rect x={x - 3.5} y={crownTop + (crownBottom - crownTop) * 0.4} width={7} height={groundY - (crownTop + (crownBottom - crownTop) * 0.4)} rx={3} fill={g.trunk} />
              <Path d={crown} fill={i ? g.leafLight : g.leaf} />
              <Path d={`M${x} ${crownBottom - 6} L${x} ${crownTop + 26}`} stroke={g.trunk} strokeWidth={2} opacity={0.5} />
            </G>
          );
        })}
        {/* The hammock: ropes to each trunk and a cloth that sags between them. */}
        <Path
          d={
            `M${leftTreeX} ${hm.y + hm.h * 0.3} L${leftTreeX + hm.w * 0.1} ${hm.y + hm.h * 0.48} ` +
            `Q${hm.x + hm.w / 2} ${hm.y + hm.h * 0.98} ${rightTreeX - hm.w * 0.1} ${hm.y + hm.h * 0.48} L${rightTreeX} ${hm.y + hm.h * 0.3}`
          }
          stroke={g.trunk}
          strokeWidth={2}
          fill="none"
        />
        <Path
          d={
            `M${leftTreeX + hm.w * 0.1} ${hm.y + hm.h * 0.48} Q${hm.x + hm.w / 2} ${hm.y + hm.h * 1.0} ${rightTreeX - hm.w * 0.1} ${hm.y + hm.h * 0.48} ` +
            `Q${hm.x + hm.w / 2} ${hm.y + hm.h * 0.78} ${leftTreeX + hm.w * 0.1} ${hm.y + hm.h * 0.48}Z`
          }
          fill={p.ground[light].fore}
        />
      </G>

      {/* Mood flowers in the flowerbed (one per day, its mood's colour). */}
      <G testID="flowerbed">
        {state.flowers.slice(-21).map((f, i) => {
          const fb = objects.flowerbed;
          const x = fb.x + 10 + ((i * 37) % Math.max(1, fb.w - 20));
          const y = fb.y + fb.h * 0.35 + (i % 3) * (fb.h * 0.2);
          return (
            <G key={f.day} testID="flower">
              <Line x1={x} y1={y} x2={x} y2={y + 9} stroke={ground.fore} strokeWidth={1.5} />
              <Circle cx={x} cy={y} r={4.5} fill={stateColors[f.mood].tint} />
              <Circle cx={x} cy={y} r={1.8} fill={g.flowerHeart} />
            </G>
          );
        })}
      </G>

      {/* Grass: V-shaped tufts along the near ground, taller with more steps. */}
      {Array.from({ length: Math.round(W / 26) }, (_, i) => {
        const x = 10 + i * 26;
        const base = H * 0.97 - (i % 3) * 8;
        return (
          <G key={i}>
            <Line x1={x} y1={base} x2={x - 3} y2={base - tuftH} stroke={ground.fore} strokeWidth={2} strokeLinecap="round" />
            <Line x1={x} y1={base} x2={x + 3} y2={base - tuftH * 0.85} stroke={ground.fore} strokeWidth={2} strokeLinecap="round" />
          </G>
        );
      })}

      {/* Fireflies on the night side of the park. */}
      {night &&
        Array.from({ length: 14 }, (_, i) => (
          <Circle key={i} cx={((i * 83) % 100) / 100 * W} cy={H * (0.55 + ((i * 29) % 35) / 100)} r={1.8} fill={p.firefly} opacity={0.8} />
        ))}
    </Svg>
  );
}
