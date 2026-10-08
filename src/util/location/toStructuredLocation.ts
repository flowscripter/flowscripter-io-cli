import type { Values } from "@flowscripter/dynamic-cli-framework";
import type { StructuredLocation } from "@flowscripter/pluggable-io-framework";

/** Converts a location argument's value into the registry's `StructuredLocation`. */
export function toStructuredLocation(value: Values): StructuredLocation {
  const protocol = value.protocol as string;
  return { protocol, location: value[protocol] ?? {} };
}
