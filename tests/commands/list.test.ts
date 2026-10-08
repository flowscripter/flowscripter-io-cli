import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createListCommand } from "../../src/commands/list.ts";

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

describe("list", () => {
  test("prints one JSON line per item in a folder", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { lines, context } = createStubContext();

    await createListCommand(registry).execute(context, { location: fileLocation(root) });

    expect(lines.length).toBe(1);
    expect(JSON.parse(lines[0]!).path).toBe("a.txt");
  });

  test("filters by a pattern location or by --regex", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    await writeFile(join(root, "b.log"), "hello");
    const pattern = createStubContext();
    const regex = createStubContext();

    await createListCommand(registry).execute(pattern.context, {
      location: fileLocation(root, { pattern: "*.txt" }),
    });
    await createListCommand(registry).execute(regex.context, {
      location: fileLocation(root),
      regex: "\\.log$",
    });

    expect(pattern.lines.map((line) => JSON.parse(line).path)).toEqual(["a.txt"]);
    expect(regex.lines.map((line) => JSON.parse(line).path)).toEqual(["b.log"]);
  });

  test("rejects an entry location and a pattern combined with --regex", async () => {
    const { context } = createStubContext();
    const list = createListCommand(registry);

    await expect(
      list.execute(context, { location: fileLocation(root, { filename: "a.txt" }) }),
    ).rejects.toThrow("list needs a folder or pattern location");
    await expect(
      list.execute(context, { location: fileLocation(root, { pattern: "*" }), regex: "a" }),
    ).rejects.toThrow("either a pattern location or --regex");
  });

  test("declares the location option for the installed protocols", () => {
    const list = createListCommand(registry);
    const location = list.options.find((option) => option.name === "location") as unknown as {
      properties: { name: string; allowableValues?: readonly unknown[] }[];
    };
    expect(location.properties[0]?.allowableValues).toEqual(["file"]);
  });
});
