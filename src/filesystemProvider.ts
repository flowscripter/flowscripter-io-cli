import { homedir } from "node:os";
import { join } from "node:path";
import {
  DefaultPluginManager,
  LocalFolderPluginRepository,
} from "@flowscripter/dynamic-plugin-framework";
import {
  PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT,
  type IOProvider,
  type IOProviderFactory,
} from "@flowscripter/pluggable-io-framework-api";

const PLUGIN_ID = "io-plugin-filesystem";

/**
 * Discovers and instantiates the `io-plugin-filesystem` provider via
 * `dynamic-plugin-framework`, rooted at `rootPath` - the same real
 * dynamic-loading path proven in `io-plugin-filesystem`'s own tests, not a
 * static import of the factory.
 */
export async function getFilesystemProvider(rootPath: string): Promise<IOProvider> {
  const bundleUrl = import.meta.resolve("@flowscripter/io-plugin-filesystem");
  const bundlePath = new URL(bundleUrl).pathname;

  const pluginFolder = join(homedir(), ".flowscripter-io-cli", "plugins");
  const repository = new LocalFolderPluginRepository(pluginFolder, "manifest.json");
  await repository.writeManifest([
    {
      pluginId: PLUGIN_ID,
      bundlePath,
      extensionPoints: [PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT],
      name: PLUGIN_ID,
      version: "0.1.0",
    },
  ]);

  const pluginManager = new DefaultPluginManager([repository]);
  await pluginManager.registerExtensions(PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT);
  const [extension] = await pluginManager.getRegisteredExtensions(
    PLUGGABLE_IO_FRAMEWORK_PROVIDER_FACTORY_EXTENSION_POINT,
  );
  if (!extension) {
    throw new Error("io-plugin-filesystem was not discovered - check it is installed correctly");
  }
  const factory = (await pluginManager.instantiate(extension.extensionHandle)) as IOProviderFactory;
  return factory.createProvider(factory.configSchema.parse({ rootPath }));
}
