import { describe, expect, test } from "bun:test";
import { getCLIFeatureOptions } from "../src/cli.ts";

describe("getCLIFeatureOptions", () => {
  test("enables the spawn service alongside the plugin service", () => {
    const options = getCLIFeatureOptions();
    expect(options.pluginServiceEnabled).toBeTrue();
    expect(options.spawnServiceEnabled).toBeTrue();
  });
});
