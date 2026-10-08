import { describe, expect, test } from "bun:test";
import type { ShutdownService } from "@flowscripter/dynamic-cli-framework";
import {
  createInterruptSignals,
  iterateUntilInterrupted,
} from "../../src/util/interruptSignals.ts";

function makeShutdownService(modes: boolean[]): ShutdownService {
  return {
    enterLongRunningMode: () => modes.push(true),
    leaveLongRunningMode: () => modes.push(false),
  } as unknown as ShutdownService;
}

describe("createInterruptSignals", () => {
  test("the first Ctrl-C aborts stop and the second aborts signal", () => {
    const modes: boolean[] = [];
    const signals = createInterruptSignals(makeShutdownService(modes));

    process.emit("SIGINT");
    expect(signals.stop.aborted).toBe(true);
    expect(signals.signal.aborted).toBe(false);
    process.emit("SIGINT");
    expect(signals.signal.aborted).toBe(true);

    signals[Symbol.dispose]();
    expect(modes).toEqual([true, false]);
  });

  test("stops listening once disposed", () => {
    const signals = createInterruptSignals(makeShutdownService([]));
    const listeners = process.listenerCount("SIGINT");

    signals[Symbol.dispose]();

    expect(process.listenerCount("SIGINT")).toBe(listeners - 1);
  });
});

describe("iterateUntilInterrupted", () => {
  async function* numbers(): AsyncGenerator<number> {
    yield 1;
    yield 2;
    yield 3;
  }

  test("yields every item when not interrupted", async () => {
    using signals = createInterruptSignals(makeShutdownService([]));
    const items: number[] = [];

    for await (const item of iterateUntilInterrupted(numbers(), signals)) items.push(item);

    expect(items).toEqual([1, 2, 3]);
  });

  test("ends gracefully once stop is aborted", async () => {
    using signals = createInterruptSignals(makeShutdownService([]));
    const items: number[] = [];

    for await (const item of iterateUntilInterrupted(numbers(), signals)) {
      items.push(item);
      process.emit("SIGINT");
    }

    expect(items).toEqual([1]);
  });

  test("rejects when signal is aborted while waiting for the next item", async () => {
    using signals = createInterruptSignals(makeShutdownService([]));
    const hanging: AsyncIterable<number> = {
      [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }),
    };
    const iterating = iterateUntilInterrupted(hanging, signals).next();

    process.emit("SIGINT");
    process.emit("SIGINT");

    await expect(iterating).rejects.toBeDefined();
  });
});
