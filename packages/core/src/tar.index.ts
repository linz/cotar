import { LogType } from '@cogeotiff/chunk';

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

export interface TarIndexBuilder {
  /** Create a index from a file  */
  create(f: AsyncFileRead | AsyncFileDescriptor, logger?: LogType): Promise<TarIndexResult>;

  /** Validate that a index matches the file */
  validate(f: AsyncFileRead | AsyncFileDescriptor, index: Buffer, logger?: LogType): Promise<void>;
}

export interface TarIndexResult {
  /** Number of files indexed */
  count: number;
  /** Output buffer */
  buffer: Buffer;
}

export enum CotarIndexType {
  Binary = 'binary',
  Ndjson = 'ndjson',
}
