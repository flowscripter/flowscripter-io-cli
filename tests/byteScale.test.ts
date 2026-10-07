import { describe, expect, test } from "bun:test";
import { createByteScale, pickByteUnit } from "../src/byteScale.ts";

describe("pickByteUnit", () => {
  test("scales to the largest unit that keeps the total at 1 or more", () => {
    expect(pickByteUnit(500)).toEqual({ unit: "bytes", divisor: 1 });
    expect(pickByteUnit(1024)).toEqual({ unit: "KB", divisor: 1024 });
    expect(pickByteUnit(1024 ** 2)).toEqual({ unit: "MB", divisor: 1024 ** 2 });
    expect(pickByteUnit(20_641_497_116)).toEqual({ unit: "GB", divisor: 1024 ** 3 });
  });
});

describe("createByteScale", () => {
  test("scales the total and subsequent values into the picked unit", () => {
    const byteScale = createByteScale(20_641_497_116);

    expect(byteScale.unit).toBe("GB");
    expect(byteScale.total).toBeCloseTo(19.22, 2);
    expect(byteScale.scale(13_817_151_488)).toBeCloseTo(12.87, 2);
  });

  test("keeps small totals in bytes", () => {
    const byteScale = createByteScale(500);

    expect(byteScale.unit).toBe("bytes");
    expect(byteScale.total).toBe(500);
    expect(byteScale.scale(250)).toBe(250);
  });

  test("format() appends the total's unit to an already-scaled value", () => {
    const byteScale = createByteScale(20_641_497_116);

    expect(byteScale.format(byteScale.total)).toBe("19.22GB");
  });

  test("formatRate() re-scales to a smaller unit when the rate is too small for the total's unit", () => {
    const byteScale = createByteScale(20_641_497_116);

    // 512KB/s expressed in GB/s (524288 / 1024^3) is real throughput, but would round to
    // "0.00GB/s" if formatted in the total's unit - formatRate() converts back to raw bytes/s
    // and re-picks a unit for that value.
    expect(byteScale.formatRate(524_288 / 1024 ** 3)).toBe("512.00KB/s");
  });

  test("formatRate() stays in the total's unit when the rate is large enough for it", () => {
    const byteScale = createByteScale(20_641_497_116);

    expect(byteScale.formatRate(1.5)).toBe("1.50GB/s");
  });
});
