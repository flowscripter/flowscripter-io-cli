import {
  type ComplexOption,
  ComplexValueTypeName,
  Icon,
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import type { EntryPropertyChanges } from "@flowscripter/pluggable-io-framework-api";
import { createLocationOption } from "../util/location/createLocationOption.ts";
import { targetKey } from "../util/location/targetKey.ts";
import { toStructuredLocation } from "../util/location/toStructuredLocation.ts";
import { requireOperation } from "../util/requireOperation.ts";
import { zodToComplexOption } from "../util/zodToComplexOption.ts";

/**
 * The `--properties` argument: one nested group per installed protocol
 * holding that protocol's settable properties, e.g. `--properties.file.mode=384`.
 * Protocols without settable properties have no group.
 */
function createPropertiesOption(registry: ProviderRegistry): ComplexOption | undefined {
  const groups = registry.getProtocols().flatMap((protocol) => {
    const properties = zodToComplexOption(registry.getFactory(protocol)!.settablePropertySchema);
    return properties.length === 0
      ? []
      : [
          {
            name: protocol,
            description: `Settable properties for the ${protocol} protocol`,
            type: ComplexValueTypeName.COMPLEX as const,
            isOptional: true,
            properties,
          },
        ];
  });
  if (groups.length === 0) {
    return undefined;
  }
  return {
    name: "properties",
    description: "Protocol-specific properties to set",
    type: ComplexValueTypeName.COMPLEX,
    isOptional: true,
    properties: groups,
  };
}

export function createSetPropertiesCommand(registry: ProviderRegistry): SubCommand {
  const propertiesOption = createPropertiesOption(registry);
  return {
    name: "set-properties",
    description: "Set properties of a file/folder",
    positionals: [],
    options: [
      createLocationOption(registry, "location", "Location to modify"),
      {
        name: "last-modified",
        description: "Last modified time to apply, as an ISO 8601 date",
        type: ValueTypeName.STRING,
        isOptional: true,
        validate: (value) =>
          Number.isNaN(Date.parse(value as string)) ? "must be an ISO 8601 date" : undefined,
      },
      {
        name: "content-type",
        description: "Content type to apply",
        type: ValueTypeName.STRING,
        isOptional: true,
      },
      ...(propertiesOption ? [propertiesOption] : []),
    ],
    async execute(context: Context, argumentValues: Values): Promise<void> {
      const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
      const location = toStructuredLocation(argumentValues.location as Values);
      const lastModified = argumentValues["last-modified"] as string | undefined;
      const contentType = argumentValues["content-type"] as string | undefined;
      const properties = (argumentValues.properties as Values | undefined)?.[location.protocol] as
        | Values
        | undefined;
      const changes: EntryPropertyChanges = {
        ...(lastModified !== undefined ? { lastModified: new Date(lastModified) } : {}),
        ...(contentType !== undefined ? { contentType } : {}),
        ...(properties !== undefined ? { properties } : {}),
      };

      const { provider, target } = await registry.createProviderForLocation(location);
      try {
        const setProperties = requireOperation(provider, "setProperties", location.protocol);
        const key = targetKey(target, "set-properties");
        await printerService.showSpinner(`Setting properties for ${key}...`);
        try {
          await setProperties(key, changes);
        } finally {
          await printerService.hideSpinner();
        }
        await printerService.print(`Updated properties for ${key}\n`, Icon.SUCCESS);
      } finally {
        await provider[Symbol.asyncDispose]();
      }
    },
  };
}
