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
}

/** Scales byte counts against a fixed total into the largest sensible unit (bytes/KB/MB/GB). */
export function createByteScale(totalBytes: number): ByteScale {
  const { unit, divisor } = pickByteUnit(totalBytes);
  const scale = (bytes: number): number => Math.round((bytes / divisor) * 100) / 100;
  return { unit, total: scale(totalBytes), scale };
}
