import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { move as moveProvider } from "@flowscripter/pluggable-io-framework";
import { getFilesystemProvider } from "../filesystemProvider.ts";

const move: SubCommand = {
  name: "move",
  description: "Move a file, using a direct provider move when possible",
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
      const handle = await printerService.showProgressBar("bytes", `Moving ${source}`, size ?? 100);
      try {
        await moveProvider(provider, source, provider, destination, {
          telemetry: {
            onProgress: (event) => {
              printerService.updateProgressBar(handle, event.bytesProcessed);
            },
          },
        });
      } finally {
        await printerService.hideProgressBar(handle);
      }
      await printerService.print(`Moved ${source} to ${destination}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default move;
