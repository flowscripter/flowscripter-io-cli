import {
  type ComplexOption,
  ComplexValueTypeName,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { zodToComplexOption } from "../zodToComplexOption.ts";

/**
 * Builds a location argument with a `protocol` property, restricted to the
 * installed protocols, and one nested group per protocol holding that
 * protocol's location fields, e.g. `--source.protocol=file
 * --source.file.path=/data --source.file.filename=a.txt`. The selected
 * protocol's group is validated against its factory's `locationSchema`.
 */
export function createLocationOption(
  registry: ProviderRegistry,
  name: string,
  description: string,
): ComplexOption {
  const protocols = registry.getProtocols();
  return {
    name,
    description,
    type: ComplexValueTypeName.COMPLEX,
    properties: [
      {
        name: "protocol",
        description: "Protocol of the location",
        type: ValueTypeName.STRING,
        allowableValues: protocols,
      },
      ...protocols.map((protocol) => ({
        name: protocol,
        description: `Location fields for the ${protocol} protocol`,
        type: ComplexValueTypeName.COMPLEX as const,
        isOptional: true,
        properties: zodToComplexOption(registry.getFactory(protocol)!.locationSchema),
      })),
    ],
    validate: (value) => {
      const location = value as Values;
      const protocol = location.protocol as string;
      const factory = registry.getFactory(protocol);
      if (!factory) {
        return `No provider installed for protocol "${protocol}"`;
      }
      const result = factory.locationSchema.safeParse(location[protocol] ?? {});
      if (result.success) {
        return undefined;
      }
      const issues = result.error.issues.map((issue) =>
        issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
      );
      return `Invalid ${protocol} location: ${issues.join("; ")}`;
    },
  };
}
