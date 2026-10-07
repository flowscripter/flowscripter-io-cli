import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Values } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { createProviderRegistry } from "../../src/providerRegistry.ts";

/**
 * Simulates `flowscripter-io-cli plugin:add @flowscripter/io-plugin-filesystem`
 * by symlinking the published package (a devDependency purely for tests)
 * into a temp plugin store, then discovers it through the CLI's registry.
 * Returns a cleanup function.
 */
export async function installFilesystemPlugin(): Promise<{
  registry: ProviderRegistry;
  cleanup: () => Promise<void>;
}> {
  const pluginsPath = await mkdtemp(join(tmpdir(), "flowscripter-io-cli-plugins-test-"));
  await mkdir(join(pluginsPath, "@flowscripter"), { recursive: true });
  await symlink(
    resolve(import.meta.dir, "..", "..", "node_modules", "@flowscripter", "io-plugin-filesystem"),
    join(pluginsPath, "@flowscripter", "io-plugin-filesystem"),
    "junction",
  );
  process.env.FLOWSCRIPTER_IO_CLI_PLUGINS_PATH = pluginsPath;
  const registry = await createProviderRegistry();
  return {
    registry,
    cleanup: async () => {
      delete process.env.FLOWSCRIPTER_IO_CLI_PLUGINS_PATH;
      await rm(pluginsPath, { recursive: true, force: true });
    },
  };
}

/** A `file` location argument value. */
export function fileLocation(path: string, fields: Values = {}): Values {
  return { protocol: "file", file: { path, ...fields } };
}
