import {
  PRETTY_PRINTER_SERVICE_ID,
  PRINTER_SERVICE_ID,
  SYNTAX_HIGHLIGHTER_SERVICE_ID,
  type Context,
  type PrettyPrinterService,
  type PrinterService,
  type SubCommand,
  type SyntaxHighlighterService,
  type Values,
} from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { createLocationOption } from "../location/createLocationOption.ts";
import { targetKey } from "../location/targetKey.ts";
import { toStructuredLocation } from "../location/toStructuredLocation.ts";

export function createGetPropertiesCommand(registry: ProviderRegistry): SubCommand {
  return {
    name: "get-properties",
    description: "Get properties of a file/folder",
    positionals: [],
    options: [createLocationOption(registry, "location", "Location to inspect")],
    async execute(context: Context, argumentValues: Values): Promise<void> {
      const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
      const prettyPrinterService = context.getServiceById(
        PRETTY_PRINTER_SERVICE_ID,
      ) as PrettyPrinterService;
      const syntaxHighlighterService = context.getServiceById(
        SYNTAX_HIGHLIGHTER_SERVICE_ID,
      ) as SyntaxHighlighterService;
      const location = toStructuredLocation(argumentValues.location as Values);

      const { provider, target } = await registry.createProviderForLocation(location);
      try {
        const properties = await provider.getProperties(targetKey(target, "get-properties"));
        const pretty = await prettyPrinterService.prettify(JSON.stringify(properties), "json");
        await printerService.print(`${syntaxHighlighterService.highlight(pretty, "json")}\n`);
      } finally {
        await provider[Symbol.asyncDispose]();
      }
    },
  };
}
