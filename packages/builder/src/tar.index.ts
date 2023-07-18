export interface MinimalBuffer {
  readonly [n: number]: number;
  length: number;
  slice(start: number, end: number): MinimalBuffer;
}

export type AsyncFileRead = (readCount: number, byteCount: number) => Promise<MinimalBuffer | null>;
export type AsyncFileOutput = { write: (data: string, cb?: () => void) => void };

export type AsyncFileReader = (
  buffer: Buffer,
  off: number,
  count: number,
  offset: number,
) => Promise<{ bytesRead: number }>;
/** Simple interface that should be similar to the output of fs.open() */
export type AsyncFileDescriptor = { read: AsyncFileReader };

export type AsyncReader = AsyncFileRead | AsyncFileDescriptor;

export interface TarIndexResult {
  /** Number of files indexed */
  count: number;
  /** Output buffer */
  buffer: Buffer;
}
