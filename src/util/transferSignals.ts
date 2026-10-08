import type { ShutdownService } from "@flowscripter/dynamic-cli-framework";

export interface TransferSignals {
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
export function createTransferSignals(shutdownService: ShutdownService): TransferSignals {
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
