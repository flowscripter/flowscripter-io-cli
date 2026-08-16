import { homedir } from "node:os";
import { join } from "node:path";

export const PLUGGABLE_IO_FRAMEWORK_PACKAGE_JSON_NAMESPACE = "pluggable-io-framework";

/**
 * Local plugin install directory shared between the CLI's built-in plugin
 * service (`plugin add`/`plugin list`, see cli.ts) and our own
 * NpmPluginRepository scan for provider-factory extensions (see
 * filesystemProvider.ts) - both must point at the same install location.
 *
 * Overridable via FLOWSCRIPTER_IO_CLI_PLUGINS_PATH so tests can point at a
 * temp directory instead of the real home directory. Read at call time (not
 * cached at module load) so a test can set the env var in `beforeAll`.
 */
export function getPluginsNodeModulesPath(): string {
  return (
    process.env.FLOWSCRIPTER_IO_CLI_PLUGINS_PATH ??
    join(homedir(), ".flowscripter-io-cli", "plugins", "node_modules")
  );
}
