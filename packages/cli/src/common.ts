import { flag } from 'cmd-ts';
import { performance } from 'perf_hooks';

export const verbose = flag({ long: 'verbose', description: 'Verbose logging', defaultValue: () => false });
export const force = flag({ long: 'force', description: 'Force overwrite files', defaultValue: () => false });

export function toDuration(now: number): number {
  return Number((performance.now() - now).toFixed(4));
}
