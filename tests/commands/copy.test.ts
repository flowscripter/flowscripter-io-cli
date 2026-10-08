import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Icon } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createCopyCommand } from "../../src/commands/copy.ts";

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

describe("copy", () => {
  test("copies a file and prints the negotiated path", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context, icons, lines, longRunningModes } = createStubContext();

    await createCopyCommand(registry).execute(context, {
      source: fileLocation(root, { filename: "a.txt" }),
      dest: fileLocation(root, { filename: "b.txt" }),
      "payload-kind": "auto",
    });

    expect(await readFile(join(root, "b.txt"), "utf8")).toBe("hello");
    expect(await readFile(join(root, "a.txt"), "utf8")).toBe("hello");
    expect(lines).toEqual([
      `Copied ${join(root, "a.txt")} to ${join(root, "b.txt")}\n`,
      "path: file/js -> file/js, direct\n",
    ]);
    expect(icons).toEqual([Icon.SUCCESS, undefined]);
    expect(longRunningModes).toEqual([true, false]);
  });

  test("copies the files matching a pattern into a folder", async () => {
    await writeFile(join(root, "a.txt"), "a");
    await writeFile(join(root, "b.log"), "b");
    await mkdir(join(root, "out"));
    const { context, spinnerMessages } = createStubContext();

    await createCopyCommand(registry).execute(context, {
      source: fileLocation(root, { pattern: "*.txt" }),
      dest: fileLocation(join(root, "out")),
    });

    expect(await readFile(join(root, "out", "a.txt"), "utf8")).toBe("a");
    await expect(stat(join(root, "out", "b.log"))).rejects.toThrow();
    expect(spinnerMessages).toEqual([`Copying *.txt in ${root}...`]);
  });

  test("fails with the registry's error for an unavailable payload kind", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context } = createStubContext();

    await expect(
      createCopyCommand(registry).execute(context, {
        source: fileLocation(root, { filename: "a.txt" }),
        dest: fileLocation(root, { filename: "b.txt" }),
        "payload-kind": "native",
      }),
    ).rejects.toThrow('No provider for protocol "file" with payload kind "native" (available: js)');
  });
});
