import type { SubCommand } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { createTransferCommand } from "./transferCommand.ts";

export function createMoveCommand(registry: ProviderRegistry): SubCommand {
  return createTransferCommand(registry, "move");
}
