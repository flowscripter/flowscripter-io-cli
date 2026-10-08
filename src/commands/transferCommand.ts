import {
  Icon,
  PRINTER_SERVICE_ID,
  SHUTDOWN_SERVICE_ID,
  type Context,
  type PrinterService,
  type ShutdownService,
  type SubCommand,
  type Values,
} from "@flowscripter/dynamic-cli-framework";
import {
  copy,
  move,
  type ProviderRegistry,
  type TransferOptions,
  type TransferResult,
} from "@flowscripter/pluggable-io-framework";
import { createByteScale } from "../util/byteScale.ts";
import { createLocationOption } from "../util/location/createLocationOption.ts";
import { describeTarget } from "../util/location/describeTarget.ts";
import { toStructuredLocation } from "../util/location/toStructuredLocation.ts";
import { payloadKindOption, toPayloadKind } from "../util/payloadKindOption.ts";
import { createTransferSignals } from "../util/transferSignals.ts";

const VERBS = {
  copy: { run: copy, progress: "Copying", done: "Copied", title: "Copy" },
  move: { run: move, progress: "Moving", done: "Moved", title: "Move" },
} as const;

/**
 * Builds the `copy` or `move` command: both locations are resolved through
 * the registry, which negotiates the providers and payload path, and the
 * negotiated path is printed with the result. The first Ctrl-C stops the
 * transfer gracefully, the second cancels it.
 */
export function createTransferCommand(
  registry: ProviderRegistry,
  type: "copy" | "move",
): SubCommand {
  const verb = VERBS[type];
  return {
    name: type,
    description: `${verb.title} a file, folder or pattern, using a direct provider ${type} when possible`,
    positionals: [],
    options: [
      createLocationOption(registry, "source", "Source location"),
      createLocationOption(registry, "dest", "Destination location"),
      payloadKindOption,
    ],
    async execute(context: Context, argumentValues: Values): Promise<void> {
      const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
      const shutdownService = context.getServiceById(SHUTDOWN_SERVICE_ID) as ShutdownService;

      const { source, dest, options } = await registry.createProvidersForTransfer(
        toStructuredLocation(argumentValues.source as Values),
        toStructuredLocation(argumentValues.dest as Values),
        { kind: toPayloadKind(argumentValues["payload-kind"]) },
      );
      const sourceName = describeTarget(source.target);
      const destName = describeTarget(dest.target);
      try {
        using signals = createTransferSignals(shutdownService);
        const transferOptions: TransferOptions = {
          ...options,
          stop: signals.stop,
          signal: signals.signal,
        };
        let result: TransferResult;
        if (source.target.kind === "entry") {
          const { size } = await source.provider.getProperties(source.target.key);
          const byteScale = createByteScale(size ?? 100);
          const handle = await printerService.showProgressBar({
            message: `${verb.progress} ${sourceName}`,
            total: byteScale.total,
            format: byteScale.format,
            formatRate: byteScale.formatRate,
          });
          try {
            result = await verb.run(source.provider, source.target, dest.provider, dest.target, {
              ...transferOptions,
              telemetry: {
                onProgress: (event) => {
                  if (event.parentOperationId === undefined) {
                    printerService.updateProgressBar(handle, byteScale.scale(event.bytesProcessed));
                  }
                },
              },
            });
          } finally {
            await printerService.hideProgressBar(handle);
          }
        } else {
          await printerService.showSpinner(`${verb.progress} ${sourceName}...`);
          try {
            result = await verb.run(
              source.provider,
              source.target,
              dest.provider,
              dest.target,
              transferOptions,
            );
          } finally {
            await printerService.hideSpinner();
          }
        }
        if (result.stopped) {
          await printerService.print(
            `${verb.title} of ${sourceName} to ${destName} stopped after ${result.bytes} bytes\n`,
            Icon.ALERT,
          );
        } else {
          await printerService.print(`${verb.done} ${sourceName} to ${destName}\n`, Icon.SUCCESS);
        }
        await printerService.print(`path: ${result.path}\n`);
      } finally {
        await source.provider[Symbol.asyncDispose]();
        await dest.provider[Symbol.asyncDispose]();
      }
    },
  };
}
