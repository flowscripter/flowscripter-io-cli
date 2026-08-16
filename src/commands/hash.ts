import {
  PRINTER_SERVICE_ID,
  type Context,
  type PrinterService,
  type SubCommand,
  type Values,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import { ChunkKind, type ChunkRef } from "@flowscripter/pluggable-io-framework-api";
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
      const hasher = new Bun.CryptoHasher(
        algorithm as ConstructorParameters<typeof Bun.CryptoHasher>[0],
      );
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value.kind === ChunkKind.Js) {
          hasher.update(value.data);
        } else {
          throw new Error("hash command only supports js-kind chunks in this version");
        }
      }
      await printerService.print(`${hasher.digest("hex")}  ${path}\n`);
    } finally {
      await provider[Symbol.asyncDispose]();
    }
  },
};

export default hash;
