import {
  type BaseCLIFeatureOptions,
  PrettyPrinterServiceProvider,
  SyntaxHighlighterServiceProvider,
  launchMultiCommandCLI,
} from "@flowscripter/dynamic-cli-framework";
import { createCopyCommand } from "./commands/copy.ts";
import { createDeleteCommand } from "./commands/delete.ts";
import { createGetPropertiesCommand } from "./commands/get-properties.ts";
import { createHashCommand } from "./commands/hash.ts";
import { createListCommand } from "./commands/list.ts";
import { createMoveCommand } from "./commands/move.ts";
import { createSetPropertiesCommand } from "./commands/set-properties.ts";
import {
  PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE,
  getPluginsNodeModulesPath,
} from "./pluginsDir.ts";
import { createProviderRegistry } from "./providerRegistry.ts";
import packageJson from "../package.json";

export function getCLIFeatureOptions(): BaseCLIFeatureOptions {
  return {
    argumentPrompterServiceEnabled: true,
    // The spawn service lets plugin:add/plugin:remove quote the package manager output and
    // clear it on success.
    spawnServiceEnabled: true,
    pluginServiceEnabled: true,
    pluginServiceRemoteConfig: {
      name: "npmjs",
      registryUrl: "https://registry.npmjs.org",
      packageJsonNamespace: PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE,
    },
    pluginServiceLocalConfig: {
      nodeModulesPath: getPluginsNodeModulesPath(),
      packageJsonNamespace: PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE,
    },
  };
}

export async function cli(): Promise<void> {
  const registry = await createProviderRegistry();
  await launchMultiCommandCLI(
    [
      createListCommand(registry),
      createGetPropertiesCommand(registry),
      createSetPropertiesCommand(registry),
      createDeleteCommand(registry),
      createCopyCommand(registry),
      createMoveCommand(registry),
      createHashCommand(registry),
    ],
    "Example CLI for pluggable-io-framework.",
    "flowscripter-io-cli",
    packageJson.version,
    [new PrettyPrinterServiceProvider(40), new SyntaxHighlighterServiceProvider(35)],
    getCLIFeatureOptions(),
  );
}
