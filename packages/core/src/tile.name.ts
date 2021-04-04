export function xyzToPath(x: number | string, y: number | string, z: number | string, compressed = true): string {
  return `tiles/${z}/${x}/${y}.pbf` + (compressed ? '.gz' : '');
}
