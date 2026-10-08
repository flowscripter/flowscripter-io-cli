import { type Option, ValueTypeName } from "@flowscripter/dynamic-cli-framework";
import type { PayloadKind } from "@flowscripter/pluggable-io-framework-api";

/**
 * Selects the payload kind of the providers: `auto` lets the registry
 * choose, `js` or `native` require that kind.
 */
export const payloadKindOption: Option = {
  name: "payload-kind",
  description: "Payload kind of the providers (auto lets the registry choose)",
  type: ValueTypeName.STRING,
  isOptional: true,
  defaultValue: "auto",
  allowableValues: ["auto", "js", "native"],
};

/** The explicit `PayloadKind` for a `--payload-kind` value, or `undefined` for `auto`. */
export function toPayloadKind(value: unknown): PayloadKind | undefined {
  return value === undefined || value === "auto" ? undefined : (value as PayloadKind);
}
