import { launchMultiCommandCLI } from "@flowscripter/dynamic-cli-framework";
import copy from "./commands/copy.ts";
import deleteCommand from "./commands/delete.ts";
import getProperties from "./commands/get-properties.ts";
import hash from "./commands/hash.ts";
import list from "./commands/list.ts";
import move from "./commands/move.ts";
import setProperties from "./commands/set-properties.ts";
import packageJson from "../package.json";

export async function cli(): Promise<void> {
  await launchMultiCommandCLI(
    [list, getProperties, setProperties, deleteCommand, copy, move, hash],
    "Example CLI for pluggable-io-framework.",
    "flowscripter-io-cli",
    packageJson.version,
  );
}
