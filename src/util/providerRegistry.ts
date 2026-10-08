import { DefaultPluginManager, NpmPluginRepository } from "@flowscripter/dynamic-plugin-framework";
import { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import {
  PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE,
  getPluginsNodeModulesPath,
} from "./pluginsDir.ts";

/**
 * Creates a `ProviderRegistry` over the local plugin store that the CLI's
 * `plugin:add` command installs into, and discovers every installed
 * provider factory and payload converter. This package has no dependency on
 * any provider plugin; one must be installed first, e.g.
 * `flowscripter-io-cli plugin:add @flowscripter/io-plugin-filesystem`.
 */
export async function createProviderRegistry(): Promise<ProviderRegistry> {
  const repository = new NpmPluginRepository({
    nodeModulesPath: getPluginsNodeModulesPath(),
    packageJsonNamespace: PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE,
  });
  const registry = new ProviderRegistry(new DefaultPluginManager([repository]));
  await registry.discover();
  return registry;
}
