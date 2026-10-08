import {
  Icon,
  PRINTER_SERVICE_ID,
  SHUTDOWN_SERVICE_ID,
  type Context,
  type PrinterService,
  type ShutdownService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { type Item, PayloadKind } from "@flowscripter/pluggable-io-framework-api";
import { Sha256Hasher } from "@flowscripter/flowscripter-io-cli-hash-native";
import { createByteScale } from "../util/byteScale.ts";
import { createLocationOption } from "../util/location/createLocationOption.ts";
import { toStructuredLocation } from "../util/location/toStructuredLocation.ts";
import { payloadKindOption, toPayloadKind } from "../util/payloadKindOption.ts";
import { createInterruptSignals } from "../util/interruptSignals.ts";

/**
 * Builds the `hash` command, which consumes a provider's readable stream
 * directly. The first Ctrl-C stops reading and prints the digest of the
 * bytes read so far, marked as stopped; the second cancels.
 */
export function createHashCommand(registry: ProviderRegistry): SubCommand {
  return {
    name: "hash",
    description: "Hash a file by piping its readable stream through a hasher",
    positionals: [],
    options: [
      createLocationOption(registry, "location", "Location of the file to hash"),
      {
        name: "algorithm",
        description: "Hash algorithm",
        type: ValueTypeName.STRING,
        shortAlias: "a",
        isOptional: true,
        defaultValue: "sha256",
        allowableValues: ["sha1", "sha256", "sha384", "sha512", "md5"],
      },
      payloadKindOption,
    ],
    async execute(context: Context, argumentValues: Values): Promise<void> {
      const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
      const shutdownService = context.getServiceById(SHUTDOWN_SERVICE_ID) as ShutdownService;
      const location = toStructuredLocation(argumentValues.location as Values);
      const algorithm = argumentValues.algorithm as string;

      const { provider, target } = await registry.createProviderForLocation(location, {
        kind: toPayloadKind(argumentValues["payload-kind"]),
      });
      try {
        if (target.kind !== "entry") {
          throw new Error("hash needs a single entry location");
        }
        const path = target.key;
        const { size } = await provider.getProperties(path);
        const byteScale = createByteScale(size ?? 100);
        const progressHandle = await printerService.showProgressBar({
          message: `Hashing ${path}`,
          total: byteScale.total,
          format: byteScale.format,
          formatRate: byteScale.formatRate,
        });
        let bytesProcessed = 0;
        const onChunk = (chunkLength: number): void => {
          bytesProcessed += chunkLength;
          printerService.updateProgressBar(progressHandle, byteScale.scale(bytesProcessed));
        };
        let digestHex: string;
        let stopped: boolean;
        try {
          using signals = createInterruptSignals(shutdownService);
          const handle = await provider.getReadableStream(path);
          const reader = (handle.stream as ReadableStream<Item>).getReader();
          const cancel = () => {
            reader.cancel().catch(() => {});
          };
          signals.stop.addEventListener("abort", cancel);
          signals.signal.addEventListener("abort", cancel);
          digestHex =
            algorithm === "sha256"
              ? await hashWithNativeSha256(reader, onChunk)
              : await hashWithBunCryptoHasher(reader, algorithm, onChunk);
          signals.signal.throwIfAborted();
          stopped = signals.stop.aborted;
        } finally {
          await printerService.hideProgressBar(progressHandle);
        }
        if (stopped) {
          await printerService.print(
            `Hashing stopped after ${bytesProcessed} bytes, digest covers only those bytes\n`,
            Icon.ALERT,
          );
        }
        await printerService.print(`${digestHex}  ${path}\n`);
      } finally {
        await provider[Symbol.asyncDispose]();
      }
    },
  };
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashWithNativeSha256(
  reader: ReadableStreamDefaultReader<Item>,
  onChunk: (chunkLength: number) => void,
): Promise<string> {
  const hasher = new Sha256Hasher();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const { payload } = value;
    if (payload.kind === PayloadKind.Js) {
      hasher.update(payload.data);
      onChunk(payload.data.byteLength);
    } else {
      hasher.updatePointer(payload.ptr, payload.length);
      onChunk(payload.length);
      payload.release();
    }
  }
  return toHex(hasher.final());
}

async function hashWithBunCryptoHasher(
  reader: ReadableStreamDefaultReader<Item>,
  algorithm: string,
  onChunk: (chunkLength: number) => void,
): Promise<string> {
  const hasher = new Bun.CryptoHasher(
    algorithm as ConstructorParameters<typeof Bun.CryptoHasher>[0],
  );
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const { payload } = value;
    if (payload.kind === PayloadKind.Js) {
      hasher.update(payload.data);
      onChunk(payload.data.byteLength);
    } else {
      payload.release();
      throw new Error(`hash command only supports js-kind payloads for algorithm "${algorithm}"`);
    }
  }
  return hasher.digest("hex");
}
