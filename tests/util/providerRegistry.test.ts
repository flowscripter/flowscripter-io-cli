import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PayloadKind } from "@flowscripter/pluggable-io-framework-api";
import { createProviderRegistry } from "../../src/util/providerRegistry.ts";
import { installFilesystemPlugin } from "../fixtures/pluginStore.ts";

describe("createProviderRegistry", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ cleanup } = await installFilesystemPlugin());
  });

  afterAll(async () => {
    await cleanup();
  });

  test("discovers the provider plugins in the local plugin store", async () => {
    const registry = await createProviderRegistry();
    expect(registry.getProtocols()).toEqual(["file"]);
    expect(registry.getKinds("file")).toEqual([PayloadKind.Js]);
  });
});

describe("createProviderRegistry with an empty plugin store", () => {
  test("discovers no protocols", async () => {
    const pluginsPath = await mkdtemp(join(tmpdir(), "flowscripter-io-cli-empty-plugins-"));
    process.env.FLOWSCRIPTER_IO_CLI_PLUGINS_PATH = pluginsPath;
    try {
      const registry = await createProviderRegistry();
      expect(registry.getProtocols()).toEqual([]);
    } finally {
      delete process.env.FLOWSCRIPTER_IO_CLI_PLUGINS_PATH;
      await rm(pluginsPath, { recursive: true, force: true });
    }
  });
});
