import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { copy as copyProvider } from "@flowscripter/pluggable-io-framework";
import { getFilesystemProvider } from "../filesystemProvider.ts";

const copy: SubCommand = {
  name: "copy",
  description: "Copy a file, using a direct provider copy when possible",
  positionals: [
    {
      name: "source",
      description: "Source path",
      type: ValueTypeName.STRING,
    },
    {
      name: "destination",
      description: "Destination path",
      type: ValueTypeName.STRING,
    },
  ],
  options: [],
  async execute(context: Context, argumentValues: Values): Promise<void> {
    const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
    const source = argumentValues.source as string;
    const destination = argumentValues.destination as string;

    const provider = await getFilesystemProvider("/");
    try {
      const { size } = await provider.getProperties(source);
      const handle = await printerService.showProgressBar(
        "bytes",
        `Copying ${source}`,
        size ?? 100,
      );
      try {
        await copyProvider(provider, source, provider, destination, {
          telemetry: {
            onProgress: (event) => {
              printerService.updateProgressBar(handle, event.bytesProcessed);
            },
          },
        });
      } finally {
        await printerService.hideProgressBar(handle);
      }
      await printerService.print(`Copied ${source} to ${destination}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default copy;
