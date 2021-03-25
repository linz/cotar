export interface TarIndexRecord {
  /** Offset in bytes */
  o: number;
  /** Size in bytes */
  s: number;
}

export type TarIndex = Record<string, TarIndexRecord>;
