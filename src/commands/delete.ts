import {
  Icon,
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
} from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { createLocationOption } from "../location/createLocationOption.ts";
import { targetKey } from "../location/targetKey.ts";
import { toStructuredLocation } from "../location/toStructuredLocation.ts";
import { requireOperation } from "../requireOperation.ts";

export function createDeleteCommand(registry: ProviderRegistry): SubCommand {
  return {
    name: "delete",
    description: "Delete a file/folder",
    positionals: [],
    options: [createLocationOption(registry, "location", "Location to delete")],
    async execute(context: Context, argumentValues: Values): Promise<void> {
      const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
      const location = toStructuredLocation(argumentValues.location as Values);

      const { provider, target } = await registry.createProviderForLocation(location);
      try {
        const deleteEntry = requireOperation(provider, "delete", location.protocol);
        const key = targetKey(target, "delete");
        await printerService.showSpinner(`Deleting ${key}...`);
        try {
          await deleteEntry(key);
        } finally {
          await printerService.hideSpinner();
        }
        await printerService.print(`Deleted ${key}\n`, Icon.SUCCESS);
      } finally {
        await provider[Symbol.asyncDispose]();
      }
    },
  };
}
