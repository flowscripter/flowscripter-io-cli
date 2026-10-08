import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createGetPropertiesCommand } from "../../src/commands/get-properties.ts";

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

describe("get-properties", () => {
  test("prints properties as pretty-printed JSON", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { lines, context } = createStubContext();

    await createGetPropertiesCommand(registry).execute(context, {
      location: fileLocation(root, { filename: "a.txt" }),
    });

    expect(JSON.parse(lines[0]!).size).toBe(5);
    expect(lines[0]).toContain("\n");
  });

  test("rejects a pattern location", async () => {
    const { context } = createStubContext();

    await expect(
      createGetPropertiesCommand(registry).execute(context, {
        location: fileLocation(root, { pattern: "*" }),
      }),
    ).rejects.toThrow("get-properties does not accept a pattern location");
  });
});
