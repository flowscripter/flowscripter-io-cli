import type { ShutdownService } from "@flowscripter/dynamic-cli-framework";

export interface InterruptSignals {
  /** Aborted by the first Ctrl-C: end gracefully and report the result as stopped. */
  readonly stop: AbortSignal;
  /** Aborted by the second Ctrl-C: cancel. */
  readonly signal: AbortSignal;
  [Symbol.dispose](): void;
}

/**
 * Maps Ctrl-C during a transfer to `stop` on the first press and `signal`
 * on the second. The CLI is kept in long-running mode until disposed, so
 * the first press does not exit the process.
 */
export function createInterruptSignals(shutdownService: ShutdownService): InterruptSignals {
  const stop = new AbortController();
  const cancel = new AbortController();
  const onInterrupt = () => {
    if (!stop.signal.aborted) {
      stop.abort();
    } else {
      cancel.abort();
    }
  };
  shutdownService.enterLongRunningMode();
  process.on("SIGINT", onInterrupt);
  return {
    stop: stop.signal,
    signal: cancel.signal,
    [Symbol.dispose]() {
      process.removeListener("SIGINT", onInterrupt);
      shutdownService.leaveLongRunningMode();
    },
  };
}

function rejectOnAbort(signal: AbortSignal): { promise: Promise<never>; release(): void } {
  let onAbort: () => void = () => {};
  const promise = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
  return { promise, release: () => signal.removeEventListener("abort", onAbort) };
}

/**
 * Yields the items of `source` until `signals.stop` is aborted, which ends
 * the iteration gracefully. Aborting `signals.signal` rejects, even while
 * waiting for the next item.
 */
export async function* iterateUntilInterrupted<T>(
  source: AsyncIterable<T>,
  signals: InterruptSignals,
): AsyncGenerator<T> {
  const iterator = source[Symbol.asyncIterator]();
  const cancelled = rejectOnAbort(signals.signal);
  cancelled.promise.catch(() => {});
  try {
    while (!signals.stop.aborted) {
      const next = await Promise.race([iterator.next(), cancelled.promise]);
      if (next.done) return;
      yield next.value;
    }
  } finally {
    cancelled.release();
    iterator.return?.().catch(() => {});
  }
}
