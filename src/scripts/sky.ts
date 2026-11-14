/**
 * Day → night skies. Each key is [hour, top colour, bottom colour]; colours in
 * between are mixed linearly in RGB.
 */
export type SkyKey = [hour: number, top: string, bottom: string];

/** The full sky (spec §4): used by the past-work page. */
export const SKY: SkyKey[] = [
  [6, '#4A5C9E', '#F2A88A'],
  [7.6, '#7FA8DD', '#F7DCC2'],
  [12, '#69A1DE', '#D6E8F6'],
  [16, '#7B9FD5', '#F3D5B6'],
  [17.4, '#465092', '#F28A60'],
  [18.6, '#232859', '#6A4977'],
  [20, '#0D1230', '#1F2649'],
  [22, '#070B1E', '#141A36'],
];

/**
 * A paler sky for long reading (from the WritingWall mockup). One change: the
 * 17.6 top colour is lighter than the mockup's #5A5F9E so dark ink stays
 * readable on it until the ink flips to light.
 */
export const READER_SKY: SkyKey[] = [
  [7, '#9CC0E6', '#F7E4CF'],
  [12, '#B8D4EE', '#F4ECE0'],
  [16, '#A9B9DC', '#F3D9BE'],
  [17.6, '#7F86C0', '#E9957A'],
  [19, '#2C2F66', '#6E4E7E'],
  [22, '#0B0F28', '#1A1F3F'],
];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

/** Top and bottom sky colours at a given hour. */
export function skyAt(hour: number, keys: SkyKey[]): { top: string; bottom: string } {
  if (hour <= keys[0][0]) return { top: keys[0][1], bottom: keys[0][2] };
  for (let j = 0; j < keys.length - 1; j++) {
    const [h0, t0, b0] = keys[j];
    const [h1, t1, b1] = keys[j + 1];
    if (hour >= h0 && hour <= h1) {
      const t = (hour - h0) / (h1 - h0);
      return { top: mix(t0, t1, t), bottom: mix(b0, b1, t) };
    }
  }
  const lastKey = keys[keys.length - 1];
  return { top: lastKey[1], bottom: lastKey[2] };
}
