export function xyzToPath(x: number, y: number, z: number, compressed = true): string {
  return `tiles/${z}/${x}/${y}.pbf` + (compressed ? '.gz' : '');
}
