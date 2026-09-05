import {
  DefaultPrettyPrinterService,
  DefaultSyntaxHighlighterService,
  PRETTY_PRINTER_SERVICE_ID,
  PRINTER_SERVICE_ID,
  SYNTAX_HIGHLIGHTER_SERVICE_ID,
  type Context,
  type PrinterService,
} from "@flowscripter/dynamic-cli-framework";

export interface StubPrinter {
  lines: string[];
  spinnerMessages: string[];
  progressUpdates: number[];
  context: Context;
}

/**
 * Minimal Context/PrinterService stub - only the PrinterService members our
 * commands actually call are implemented; everything else would throw if
 * invoked, which is intentional (a test relying on it should fail loudly).
 *
 * The pretty printer and syntax highlighter are the real default
 * implementations (colorEnabled = false, so highlight() is a no-op) so
 * `get-properties`/`list` output stays plain, JSON.parse-able text in tests.
 */
export function createStubContext(): StubPrinter {
  const lines: string[] = [];
  const spinnerMessages: string[] = [];
  const progressUpdates: number[] = [];
  const printerService = {
    print: async (message: string) => {
      lines.push(message);
    },
    showProgressBar: async () => 0,
    updateProgressBar: (_handle: number, current: number) => {
      progressUpdates.push(current);
    },
    hideProgressBar: async () => {},
    showSpinner: async (message: string) => {
      spinnerMessages.push(message);
    },
    hideSpinner: async () => {},
  } as unknown as PrinterService;

  const prettyPrinterService = new DefaultPrettyPrinterService();
  const syntaxHighlighterService = new DefaultSyntaxHighlighterService();
  syntaxHighlighterService.colorEnabled = false;

  const services: Record<string, unknown> = {
    [PRINTER_SERVICE_ID]: printerService,
    [PRETTY_PRINTER_SERVICE_ID]: prettyPrinterService,
    [SYNTAX_HIGHLIGHTER_SERVICE_ID]: syntaxHighlighterService,
  };

  const context: Context = {
    cliConfig: { name: "test", version: "0.0.0" },
    getServiceById: (id: string) => services[id],
    doesServiceExist: (id: string) => id in services,
  };

  return { lines, spinnerMessages, progressUpdates, context };
}
