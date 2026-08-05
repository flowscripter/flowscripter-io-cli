import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { getFilesystemProvider } from "../filesystemProvider.ts";

const deleteCommand: SubCommand = {
  name: "delete",
  description: "Delete a file/folder",
  positionals: [
    {
      name: "path",
      description: "Path to delete",
      type: ValueTypeName.STRING,
    },
  ],
  options: [],
  async execute(context: Context, argumentValues: Values): Promise<void> {
    const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
    const path = argumentValues.path as string;

    const provider = await getFilesystemProvider("/");
    try {
      await provider.delete(path);
      await printerService.print(`Deleted ${path}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default deleteCommand;
