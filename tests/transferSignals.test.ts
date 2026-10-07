import { describe, expect, test } from "bun:test";
import type { ShutdownService } from "@flowscripter/dynamic-cli-framework";
import { createTransferSignals } from "../src/transferSignals.ts";

function makeShutdownService(modes: boolean[]): ShutdownService {
  return {
    enterLongRunningMode: () => modes.push(true),
    leaveLongRunningMode: () => modes.push(false),
  } as unknown as ShutdownService;
}

describe("createTransferSignals", () => {
  test("the first Ctrl-C aborts stop and the second aborts signal", () => {
    const modes: boolean[] = [];
    const signals = createTransferSignals(makeShutdownService(modes));

    process.emit("SIGINT");
    expect(signals.stop.aborted).toBe(true);
    expect(signals.signal.aborted).toBe(false);
    process.emit("SIGINT");
    expect(signals.signal.aborted).toBe(true);

    signals[Symbol.dispose]();
    expect(modes).toEqual([true, false]);
  });

  test("stops listening once disposed", () => {
    const signals = createTransferSignals(makeShutdownService([]));
    const listeners = process.listenerCount("SIGINT");

    signals[Symbol.dispose]();

    expect(process.listenerCount("SIGINT")).toBe(listeners - 1);
  });
});
