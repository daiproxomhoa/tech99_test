/**
 * Generate a deterministic mock 7-day price series for a token. The series
 * walks ±3% per step seeded by the symbol so repeated renders are stable.
 * Used purely for the sparkline UI; never feeds into swap math.
 */

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mockSeries(symbol: string, current: number, points = 24): number[] {
  const rand = mulberry32(hash(symbol));
  const out: number[] = new Array(points);
  let v = current * (0.92 + rand() * 0.16); // start within ±8%
  for (let i = 0; i < points - 1; i++) {
    const drift = (rand() - 0.5) * 0.06; // ±3%
    v = Math.max(v * (1 + drift), 0.0001);
    out[i] = v;
  }
  out[points - 1] = current;
  return out;
}

/** Build an SVG polyline `points` string normalized to width × height. */
export function buildPath(series: number[], width: number, height: number, pad = 2): string {
  if (series.length === 0) return '';
  let min = Infinity;
  let max = -Infinity;
  for (const v of series) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = innerW / (series.length - 1 || 1);
  return series
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + innerH - ((v - min) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
