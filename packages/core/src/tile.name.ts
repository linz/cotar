export function xyzToPath(x: number, y: number, z: number): string {
  return `tiles/${z}/${x}/${y}.pbf`;
}
