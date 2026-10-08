import {
  Icon,
  PRETTY_PRINTER_SERVICE_ID,
  PRINTER_SERVICE_ID,
  SHUTDOWN_SERVICE_ID,
  SYNTAX_HIGHLIGHTER_SERVICE_ID,
  type Context,
  type PrettyPrinterService,
  type PrinterService,
  type ShutdownService,
  type SubCommand,
  type SyntaxHighlighterService,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { globToRegex, type ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { createLocationOption } from "../util/location/createLocationOption.ts";
import { toStructuredLocation } from "../util/location/toStructuredLocation.ts";
import { createInterruptSignals, iterateUntilInterrupted } from "../util/interruptSignals.ts";
import { requireOperation } from "../util/requireOperation.ts";

/**
 * Builds the `list` command. The first Ctrl-C stops listing gracefully,
 * the second cancels.
 */
export function createListCommand(registry: ProviderRegistry): SubCommand {
  return {
    name: "list",
    description: "List files/folders, optionally recursive and filtered by regex or pattern",
    positionals: [],
    options: [
      createLocationOption(registry, "location", "Folder or pattern location to list"),
      {
        name: "recursive",
        description: "List recursively",
        type: ValueTypeName.BOOLEAN,
        shortAlias: "r",
        isOptional: true,
        defaultValue: false,
      },
      {
        name: "regex",
        description: "Only list items whose path matches this regex",
        type: ValueTypeName.STRING,
        shortAlias: "e",
        isOptional: true,
      },
    ],
    async execute(context: Context, argumentValues: Values): Promise<void> {
      const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
      const prettyPrinterService = context.getServiceById(
        PRETTY_PRINTER_SERVICE_ID,
      ) as PrettyPrinterService;
      const syntaxHighlighterService = context.getServiceById(
        SYNTAX_HIGHLIGHTER_SERVICE_ID,
      ) as SyntaxHighlighterService;
      const shutdownService = context.getServiceById(SHUTDOWN_SERVICE_ID) as ShutdownService;
      const location = toStructuredLocation(argumentValues.location as Values);
      const recursive = argumentValues.recursive as boolean | undefined;
      const regex = argumentValues.regex as string | undefined;

      const { provider, target } = await registry.createProviderForLocation(location);
      try {
        const list = requireOperation(provider, "list", location.protocol);
        if (target.kind === "entry") {
          throw new Error("list needs a folder or pattern location, not a single entry");
        }
        if (target.kind === "pattern" && regex !== undefined) {
          throw new Error("list accepts either a pattern location or --regex, not both");
        }
        const items =
          target.kind === "pattern"
            ? list(target.containerKey, { recursive, regex: globToRegex(target.pattern) })
            : list(target.key, { recursive, regex: regex ? new RegExp(regex) : undefined });
        using signals = createInterruptSignals(shutdownService);
        for await (const item of iterateUntilInterrupted(items, signals)) {
          const pretty = await prettyPrinterService.prettify(
            JSON.stringify({ path: item.path, ...item.properties }),
            "json",
          );
          await printerService.print(`${syntaxHighlighterService.highlight(pretty, "json")}\n`);
        }
        if (signals.stop.aborted) {
          await printerService.print("Listing stopped before all items were listed\n", Icon.ALERT);
        }
      } finally {
        await provider[Symbol.asyncDispose]();
      }
    },
  };
}
