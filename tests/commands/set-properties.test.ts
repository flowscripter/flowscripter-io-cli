import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Icon } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createSetPropertiesCommand } from "../../src/commands/set-properties.ts";

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

describe("set-properties", () => {
  test("applies the protocol's properties and last-modified, with a spinner", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context, icons, spinnerMessages } = createStubContext();

    await createSetPropertiesCommand(registry).execute(context, {
      location: fileLocation(root, { filename: "a.txt" }),
      "last-modified": "2020-01-02T03:04:05.000Z",
      properties: { file: { mode: 0o600 } },
    });

    const stats = await stat(join(root, "a.txt"));
    if (process.platform !== "win32") {
      expect(stats.mode & 0o777).toBe(0o600);
    }
    expect(stats.mtime.toISOString()).toBe("2020-01-02T03:04:05.000Z");
    expect(spinnerMessages).toEqual([`Setting properties for ${join(root, "a.txt")}...`]);
    expect(icons).toEqual([Icon.SUCCESS]);
  });

  test("declares one --properties group per protocol with settable properties", () => {
    const command = createSetPropertiesCommand(registry);
    const properties = command.options.find(
      (option) => option.name === "properties",
    ) as unknown as {
      properties: { name: string; properties: { name: string }[] }[];
    };
    expect(properties.properties.map((group) => group.name)).toEqual(["file"]);
    expect(properties.properties[0]?.properties.map((property) => property.name)).toEqual(["mode"]);
  });

  test("validates --last-modified", () => {
    const command = createSetPropertiesCommand(registry);
    const lastModified = command.options.find((option) => option.name === "last-modified");
    expect(lastModified?.validate?.("not a date")).toBe("must be an ISO 8601 date");
    expect(lastModified?.validate?.("2020-01-02")).toBeUndefined();
  });
});
