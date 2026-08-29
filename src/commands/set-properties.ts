import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { getFilesystemProvider } from "../filesystemProvider.ts";

const setProperties: SubCommand = {
  name: "set-properties",
  description: "Set properties of a file/folder",
  positionals: [
    {
      name: "path",
      description: "Path to modify",
      type: ValueTypeName.STRING,
    },
  ],
  options: [
    {
      name: "mode",
      description: "Unix file mode to apply e.g. 384 for 0o600 (ignored on Windows)",
      type: ValueTypeName.NUMBER,
      shortAlias: "m",
      isOptional: true,
    },
  ],
  async execute(context: Context, argumentValues: Values): Promise<void> {
    const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
    const path = argumentValues.path as string;
    const mode = argumentValues.mode as number | undefined;

    const provider = await getFilesystemProvider("");
    try {
      await printerService.showSpinner(`Setting properties for ${path}...`);
      try {
        await provider.setProperties(path, mode !== undefined ? { mode } : {});
      } finally {
        await printerService.hideSpinner();
      }
      await printerService.print(`Updated properties for ${path}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default setProperties;
