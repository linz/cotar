export interface LogType {
  debug: LogFunc;
  warn: LogFunc;
  info: LogFunc;
  fatal: LogFunc;
}

export type LogFunc = (a: unknown, b: string | undefined) => void;
