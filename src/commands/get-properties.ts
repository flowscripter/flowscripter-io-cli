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
    const prettyPrinterService = context.getServiceById(
      PRETTY_PRINTER_SERVICE_ID,
    ) as PrettyPrinterService;
    const syntaxHighlighterService = context.getServiceById(
      SYNTAX_HIGHLIGHTER_SERVICE_ID,
    ) as SyntaxHighlighterService;
    const path = argumentValues.path as string;

    const provider = await getFilesystemProvider("");
    try {
      const properties = await provider.getProperties(path);
      const pretty = await prettyPrinterService.prettify(JSON.stringify(properties), "json");
      await printerService.print(`${syntaxHighlighterService.highlight(pretty, "json")}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default getProperties;
