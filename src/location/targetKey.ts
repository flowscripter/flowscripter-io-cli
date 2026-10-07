import type { LocationTarget } from "@flowscripter/pluggable-io-framework-api";

/** The key of an `entry` or `container` target; a `pattern` target is rejected. */
export function targetKey(target: LocationTarget, command: string): string {
  if (target.kind === "pattern") {
    throw new Error(`${command} does not accept a pattern location`);
  }
  return target.key;
}
