import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Icon, PRINTER_SERVICE_ID, type PrinterService } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createTransferCommand } from "../../src/commands/transferCommand.ts";

let registry: ProviderRegistry;
let cleanup: () => Promise<void>;
let root: string;

beforeAll(async () => {
  ({ registry, cleanup } = await installFilesystemPlugin());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "flowscripter-io-cli-test-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("createTransferCommand", () => {
  test("declares source, dest and payload-kind options", () => {
    const command = createTransferCommand(registry, "move");
    expect(command.name).toBe("move");
    expect(command.description).toStartWith("Move a file");
    expect(command.options.map((option) => option.name)).toEqual([
      "source",
      "dest",
      "payload-kind",
    ]);
  });

  test("reports a transfer stopped by the first Ctrl-C", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    await mkdir(join(root, "out"));
    const { context, lines, icons } = createStubContext();
    const printerService = context.getServiceById(PRINTER_SERVICE_ID) as PrinterService;
    printerService.showSpinner = async () => {
      process.emit("SIGINT");
    };

    await createTransferCommand(registry, "copy").execute(context, {
      source: fileLocation(root, { pattern: "*.txt" }),
      dest: fileLocation(join(root, "out")),
    });

    expect(lines[0]).toBe(
      `Copy of *.txt in ${root} to ${join(root, "out")} stopped after 0 bytes\n`,
    );
    expect(icons[0]).toBe(Icon.ALERT);
    await expect(stat(join(root, "out", "a.txt"))).rejects.toThrow();
  });
});
