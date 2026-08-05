import { DefaultPluginManager, NpmPluginRepository } from "@flowscripter/dynamic-plugin-framework";
import {
  PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT,
  type IOProvider,
  type IOProviderFactory,
} from "@flowscripter/pluggable-io-framework-api";
import {
  PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE,
  getPluginsNodeModulesPath,
} from "./pluginsDir.ts";

/**
 * Discovers and instantiates the filesystem provider (`io-plugin-filesystem`
 * or any other installed provider-factory plugin) purely via
 * `dynamic-plugin-framework`'s `NpmPluginRepository`, scanning the same
 * local plugin store the CLI's `plugin:add` command installs into (see
 * cli.ts) - this package has no direct npm dependency on any provider
 * plugin; it must be installed by the user first, e.g.
 * `flowscripter-io-cli plugin:add @flowscripter/io-plugin-filesystem`.
 */
export async function getFilesystemProvider(rootPath: string): Promise<IOProvider> {
  const repository = new NpmPluginRepository({
    nodeModulesPath: getPluginsNodeModulesPath(),
    packageJsonNamespace: PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE,
  });

  const pluginManager = new DefaultPluginManager([repository]);
  await pluginManager.registerExtensions(PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT);
  const [extension] = await pluginManager.getRegisteredExtensions(
    PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT,
  );
  if (!extension) {
    throw new Error(
      "No pluggable-io-framework provider plugin installed - run: " +
        "flowscripter-io-cli plugin:add @flowscripter/io-plugin-filesystem",
    );
  }
  const factory = (await pluginManager.instantiate(extension.extensionHandle)) as IOProviderFactory;
  return factory.createProvider(factory.configSchema.parse({ rootPath }));
}
