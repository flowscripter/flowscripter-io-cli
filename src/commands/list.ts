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

const list: SubCommand = {
  name: "list",
  description: "List files/folders, optionally recursive and filtered by regex",
  positionals: [
    {
      name: "path",
      description: "Path to list",
      type: ValueTypeName.STRING,
    },
  ],
  options: [
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
    const path = argumentValues.path as string;
    const recursive = argumentValues.recursive as boolean | undefined;
    const regex = argumentValues.regex as string | undefined;

    const provider = await getFilesystemProvider("");
    try {
      for await (const item of provider.list(path, {
        recursive,
        regex: regex ? new RegExp(regex) : undefined,
      })) {
        const pretty = await prettyPrinterService.prettify(
          JSON.stringify({ path: item.path, ...item.properties }),
          "json",
        );
        await printerService.print(`${syntaxHighlighterService.highlight(pretty, "json")}\n`);
      }
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default list;
