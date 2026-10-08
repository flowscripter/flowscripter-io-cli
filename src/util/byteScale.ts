const BYTE_UNITS: ReadonlyArray<{ unit: string; divisor: number }> = [
  { unit: "GB", divisor: 1024 ** 3 },
  { unit: "MB", divisor: 1024 ** 2 },
  { unit: "KB", divisor: 1024 },
  { unit: "bytes", divisor: 1 },
];

/** Picks the largest unit that keeps `totalBytes` at 1 or more, so the scaled total isn't < 1. */
export function pickByteUnit(totalBytes: number): { unit: string; divisor: number } {
  return (
    BYTE_UNITS.find(({ divisor }) => totalBytes >= divisor) ?? BYTE_UNITS[BYTE_UNITS.length - 1]!
  );
}

export interface ByteScale {
  readonly unit: string;
  readonly total: number;
  scale(bytes: number): number;
  /** Formats an already-scaled current/total value, e.g. `5.00GB`. */
  format(value: number): string;
  /**
   * Formats a rate (in this scale's unit per second) independently of {@link format} - converts
   * back to raw bytes/s and re-picks the best-fitting unit, so a rate too small to show
   * meaningfully in the total's unit (e.g. a stalled GB-scale transfer) renders in a smaller one
   * instead of rounding to zero.
   */
  formatRate(rate: number): string;
}

/** Scales byte counts against a fixed total into the largest sensible unit (bytes/KB/MB/GB). */
export function createByteScale(totalBytes: number): ByteScale {
  const { unit, divisor } = pickByteUnit(totalBytes);
  const scale = (bytes: number): number => Math.round((bytes / divisor) * 100) / 100;
  const format = (value: number): string => `${value.toFixed(2)}${unit}`;
  const formatRate = (rate: number): string => {
    const bytesPerSecond = rate * divisor;
    const rateUnit = pickByteUnit(bytesPerSecond);
    return `${(bytesPerSecond / rateUnit.divisor).toFixed(2)}${rateUnit.unit}/s`;
  };
  return { unit, total: scale(totalBytes), scale, format, formatRate };
}
