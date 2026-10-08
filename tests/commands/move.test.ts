import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Icon } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createMoveCommand } from "../../src/commands/move.ts";

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

describe("move", () => {
  test("moves a file", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context, icons } = createStubContext();

    await createMoveCommand(registry).execute(context, {
      source: fileLocation(root, { filename: "a.txt" }),
      dest: fileLocation(root, { filename: "b.txt" }),
    });

    expect(await readFile(join(root, "b.txt"), "utf8")).toBe("hello");
    await expect(stat(join(root, "a.txt"))).rejects.toThrow();
    expect(icons).toEqual([Icon.SUCCESS, undefined]);
  });
});
