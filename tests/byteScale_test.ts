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
});
