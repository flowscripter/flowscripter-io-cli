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
      const handle = await provider.getReadableStream(path);
      const reader = (handle.stream as ReadableStream<ChunkRef>).getReader();
      const digestHex =
        algorithm === "sha256"
          ? await hashWithNativeSha256(reader)
          : await hashWithBunCryptoHasher(reader, algorithm);
      await printerService.print(`${digestHex}  ${path}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashWithNativeSha256(
  reader: ReadableStreamDefaultReader<ChunkRef>,
): Promise<string> {
  const hasher = new Sha256Hasher();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value.kind === ChunkKind.Js) {
      hasher.update(value.data);
    } else {
      hasher.updatePointer(value.ptr, value.length);
      value.release();
    }
  }
  return toHex(hasher.final());
}

async function hashWithBunCryptoHasher(
  reader: ReadableStreamDefaultReader<ChunkRef>,
  algorithm: string,
): Promise<string> {
  const hasher = new Bun.CryptoHasher(
    algorithm as ConstructorParameters<typeof Bun.CryptoHasher>[0],
  );
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value.kind === ChunkKind.Js) {
      hasher.update(value.data);
    } else {
      throw new Error(`hash command only supports js-kind chunks for algorithm "${algorithm}"`);
    }
  }
  return hasher.digest("hex");
}

export default hash;
