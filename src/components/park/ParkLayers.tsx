import React, { useEffect, useState } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { parkColors as p } from '@/constants/colors';
import { useReduceMotion } from '@/hooks/useReduceMotion';

export type ParkLight = 'dawn' | 'day' | 'dusk' | 'night' | 'rain';

const TICK_MS = 120; // the drifting layers only; the world drawing itself never re-renders on a timer

/** A slow clock for gentle drift. Frozen at 0 when the phone asks for less motion. */
export function useDrift(): number {
  const reduce = useReduceMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setT((v) => v + TICK_MS / 1000), TICK_MS);
    return () => clearInterval(timer);
  }, [reduce]);
  return reduce ? 0 : t;
}

const STARS = Array.from({ length: 26 }, (_, i) => [((i * 97) % 100) / 100, ((i * 53) % 45) / 100] as const);

/** Sky gradient, sun or moon, stars and clouds. Slowest parallax layer. */
export function SkyLayer({ width, height, light }: { width: number; height: number; light: ParkLight }) {
  const t = useDrift();
  const sky = p.sky[light];
  const id = `park-sky-${light}`;
  const sun =
    light === 'dawn'
      ? { x: 0.55, y: 0.36, fill: p.sun.dawn }
      : light === 'day'
        ? { x: 0.7, y: 0.14, fill: p.sun.day }
        : light === 'dusk'
          ? { x: 0.6, y: 0.4, fill: p.sun.dusk }
          : null;
  const drift = Math.sin(t * 0.08) * 10;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sky.top} />
          <Stop offset="0.6" stopColor={sky.low} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
      {light === 'night' ? (
        <>
          {STARS.map(([fx, fy], i) => (
            <Circle key={i} cx={fx * width} cy={fy * height} r={i % 4 === 0 ? 1.6 : 1} fill={p.star} opacity={0.5 + 0.5 * Math.abs(Math.sin(t * 0.5 + i))} />
          ))}
          <G testID="moon">
            <Circle cx={width * 0.72} cy={height * 0.12} r={16} fill={p.moon} />
            <Circle cx={width * 0.72 + 7} cy={height * 0.12 - 5} r={14} fill={sky.top} />
          </G>
        </>
      ) : sun ? (
        <>
          <Circle cx={sun.x * width} cy={sun.y * height} r={46} fill={sun.fill} opacity={0.35} />
          <Circle testID="sun" cx={sun.x * width} cy={sun.y * height} r={24} fill={sun.fill} />
        </>
      ) : null}
      {light !== 'night' && (
        <G transform={`translate(${drift} 0)`} opacity={light === 'rain' ? 0.9 : 0.55}>
          <Ellipse cx={width * 0.18} cy={height * 0.12} rx={70} ry={10} fill={light === 'rain' ? p.far.rain : p.cloud} />
          <Ellipse cx={width * 0.5} cy={height * 0.08} rx={90} ry={9} fill={light === 'rain' ? p.far.rain : p.cloud} />
          <Ellipse cx={width * 0.82} cy={height * 0.17} rx={60} ry={8} fill={light === 'rain' ? p.far.rain : p.cloud} />
        </G>
      )}
    </Svg>
  );
}

/** One band of rolling hills with a soft mist drifting in front of it. */
export function HillLayer({
  width,
  height,
  light,
  depth,
}: {
  width: number;
  height: number;
  light: ParkLight;
  depth: 'far' | 'mid';
}) {
  const t = useDrift();
  const top = depth === 'far' ? 0.34 : 0.44; // ridge height as a fraction of the screen
  const fill = depth === 'far' ? p.far[light] : p.mid[light];
  const humps = depth === 'far' ? 5 : 4;
  let d = `M0 ${height * (top + 0.06)}`;
  for (let i = 0; i < humps; i++) {
    const x0 = (i / humps) * width;
    const x1 = ((i + 1) / humps) * width;
    const peak = height * (top + (i % 2 ? 0.05 : 0) - (depth === 'far' ? 0.02 : 0));
    d += ` C${x0 + (x1 - x0) * 0.3} ${peak} ${x0 + (x1 - x0) * 0.7} ${peak} ${x1} ${height * (top + 0.06)}`;
  }
  d += ` L${width} ${height} L0 ${height}Z`;
  const mistShift = Math.sin(t * 0.3 + (depth === 'far' ? 0 : 1.7)) * 6;
  const mistId = `park-mist-${depth}-${light}`;
  const mistY = height * (top + 0.04);
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={mistId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.mistTint} stopOpacity={0} />
          <Stop offset="0.5" stopColor={p.mistTint} stopOpacity={p.mist[light]} />
          <Stop offset="1" stopColor={p.mistTint} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={d} fill={fill} />
      <G testID="mist" transform={`translate(${mistShift} 0)`}>
        <Rect x={-20} y={mistY} width={width + 40} height={height * 0.09} fill={`url(#${mistId})`} />
      </G>
    </Svg>
  );
}

/** Gentle rain over the whole screen (does not pan). */
export function RainLayer({ width, height }: { width: number; height: number }) {
  const t = useDrift();
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <G testID="rain">
        {Array.from({ length: 36 }, (_, i) => {
          const x = ((i * 61) % 100) / 100 * width;
          const y = (((i * 37) % 100) / 100 * height + t * 90) % height;
          return <Line key={i} x1={x} y1={y} x2={x - 3} y2={y + 12} stroke={p.river.rain.water} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />;
        })}
      </G>
    </Svg>
  );
}
