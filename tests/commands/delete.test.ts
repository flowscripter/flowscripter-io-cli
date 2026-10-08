import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Icon } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createDeleteCommand } from "../../src/commands/delete.ts";

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

describe("delete", () => {
  test("removes a file, with a spinner", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context, icons, spinnerMessages } = createStubContext();

    await createDeleteCommand(registry).execute(context, {
      location: fileLocation(root, { filename: "a.txt" }),
    });

    await expect(stat(join(root, "a.txt"))).rejects.toThrow();
    expect(spinnerMessages).toEqual([`Deleting ${join(root, "a.txt")}...`]);
    expect(icons).toEqual([Icon.SUCCESS]);
  });
});
