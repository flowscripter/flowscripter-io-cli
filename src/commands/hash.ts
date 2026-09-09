import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { ChunkKind, type ChunkRef } from "@flowscripter/pluggable-io-framework-api";
import { Sha256Hasher } from "@flowscripter/flowscripter-io-cli-hash-native";
import { getFilesystemProvider } from "../filesystemProvider.ts";

const hash: SubCommand = {
  name: "hash",
  description: "Hash a file by piping its readable stream through a hasher",
  positionals: [
    {
      name: "path",
      description: "Path to hash",
      type: ValueTypeName.STRING,
    },
  ],
  options: [
    {
      name: "algorithm",
      description: "Hash algorithm",
      type: ValueTypeName.STRING,
      shortAlias: "a",
      isOptional: true,
      defaultValue: "sha256",
    },
  ],
  async execute(context: Context, argumentValues: Values): Promise<void> {
    const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
    const path = argumentValues.path as string;
    const algorithm = argumentValues.algorithm as string;

    const provider = await getFilesystemProvider("");
    try {
      const { size } = await provider.getProperties(path);
      // Raw byte counts for large files (e.g. "13817151488/20641497116") are long enough to eat
      // all available terminal width, leaving no room for the bar itself. Scale to a human-sized
      // unit up front, based on the (fixed) total, so the progress bar has room to render.
      const { unit, divisor } = pickByteUnit(size ?? 100);
      const scale = (bytes: number): number => Math.round((bytes / divisor) * 100) / 100;
      const progressHandle = await printerService.showProgressBar(
        unit,
        `Hashing ${path}`,
        scale(size ?? 100),
      );
      let bytesProcessed = 0;
      const onChunk = (chunkLength: number): void => {
        bytesProcessed += chunkLength;
        printerService.updateProgressBar(progressHandle, scale(bytesProcessed));
      };
      try {
        const handle = await provider.getReadableStream(path);
        const reader = (handle.stream as ReadableStream<ChunkRef>).getReader();
        const digestHex =
          algorithm === "sha256"
            ? await hashWithNativeSha256(reader, onChunk)
            : await hashWithBunCryptoHasher(reader, algorithm, onChunk);
        await printerService.print(`${digestHex}  ${path}\n`);
      } finally {
        await printerService.hideProgressBar(progressHandle);
      }
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

const BYTE_UNITS: ReadonlyArray<{ unit: string; divisor: number }> = [
  { unit: "GB", divisor: 1024 ** 3 },
  { unit: "MB", divisor: 1024 ** 2 },
  { unit: "KB", divisor: 1024 },
  { unit: "bytes", divisor: 1 },
];

/** Picks the largest unit that keeps `totalBytes` at 1 or more, so the scaled total isn't < 1. */
export function pickByteUnit(totalBytes: number): { unit: string; divisor: number } {
  return (
    BYTE_UNITS.find(({ divisor }) => totalBytes >= divisor) ?? BYTE_UNITS[BYTE_UNITS.length - 1]!
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashWithNativeSha256(
  reader: ReadableStreamDefaultReader<ChunkRef>,
  onChunk: (chunkLength: number) => void,
): Promise<string> {
  const hasher = new Sha256Hasher();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value.kind === ChunkKind.Js) {
      hasher.update(value.data);
      onChunk(value.data.byteLength);
    } else {
      hasher.updatePointer(value.ptr, value.length);
      onChunk(value.length);
      value.release();
    }
  }
  return toHex(hasher.final());
}

async function hashWithBunCryptoHasher(
  reader: ReadableStreamDefaultReader<ChunkRef>,
  algorithm: string,
  onChunk: (chunkLength: number) => void,
): Promise<string> {
  const hasher = new Bun.CryptoHasher(
    algorithm as ConstructorParameters<typeof Bun.CryptoHasher>[0],
  );
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value.kind === ChunkKind.Js) {
      hasher.update(value.data);
      onChunk(value.data.byteLength);
    } else {
      throw new Error(`hash command only supports js-kind chunks for algorithm "${algorithm}"`);
    }
  }
  return hasher.digest("hex");
}

export default hash;
