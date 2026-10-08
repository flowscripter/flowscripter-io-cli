import type { LocationTarget } from "@flowscripter/pluggable-io-framework-api";

/** A short human-readable description of a `LocationTarget` for messages. */
export function describeTarget(target: LocationTarget): string {
  return target.kind === "pattern" ? `${target.pattern} in ${target.containerKey}` : target.key;
}
