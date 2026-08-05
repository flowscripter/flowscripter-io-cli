import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
} from "@flowscripter/dynamic-cli-framework";

export interface StubPrinter {
  lines: string[];
  context: Context;
}

/**
 * Minimal Context/PrinterService stub - only the PrinterService members our
 * commands actually call are implemented; everything else would throw if
 * invoked, which is intentional (a test relying on it should fail loudly).
 */
export function createStubContext(): StubPrinter {
  const lines: string[] = [];
  const printerService = {
    print: async (message: string) => {
      lines.push(message);
    },
    showProgressBar: async () => 0,
    updateProgressBar: () => {},
    hideProgressBar: async () => {},
  } as unknown as PrinterService;

  const context: Context = {
    cliConfig: { name: "test", version: "0.0.0" },
    getServiceById: (id: string) => (id === PRINTER_SERVICE_ID ? printerService : undefined),
    doesServiceExist: (id: string) => id === PRINTER_SERVICE_ID,
  };

  return { lines, context };
}
