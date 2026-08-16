import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { getFilesystemProvider } from "../filesystemProvider.ts";

const getProperties: SubCommand = {
  name: "get-properties",
  description: "Get properties of a file/folder",
  positionals: [
    {
      name: "path",
      description: "Path to inspect",
      type: ValueTypeName.STRING,
    },
  ],
  options: [],
  async execute(context: Context, argumentValues: Values): Promise<void> {
    const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
    const path = argumentValues.path as string;

    const provider = await getFilesystemProvider("");
    try {
      const properties = await provider.getProperties(path);
      await printerService.print(`${JSON.stringify(properties, null, 2)}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default getProperties;
