import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import { fileLocation, installFilesystemPlugin } from "../fixtures/pluginStore.ts";
import { createStubContext } from "../fixtures/testContext.ts";
import { createHashCommand } from "../../src/commands/hash.ts";

let registry: ProviderRegistry;
let cleanup: () => Promise<void>;
let root: string;

beforeAll(async () => {
  ({ registry, cleanup } = await installFilesystemPlugin());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "flowscripter-io-cli-test-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("hash", () => {
  test("algorithm option has a curated set of allowable values", () => {
    const algorithmOption = createHashCommand(registry).options.find(
      (option) => option.name === "algorithm",
    ) as { allowableValues?: readonly unknown[] } | undefined;
    expect(algorithmOption?.allowableValues).toEqual(["sha1", "sha256", "sha384", "sha512", "md5"]);
  });

  test("hashes a file with the default algorithm using the native hasher", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { lines, context, progressUpdates } = createStubContext();

    await createHashCommand(registry).execute(context, {
      location: fileLocation(root, { filename: "a.txt" }),
      algorithm: "sha256",
    });

    const expected = new Bun.CryptoHasher("sha256").update("hello").digest("hex");
    expect(lines[0]).toBe(`${expected}  ${join(root, "a.txt")}\n`);
    expect(progressUpdates.at(-1)).toBe(5);
  });

  test("hashes a file with a non-sha256 algorithm via the Bun.CryptoHasher fallback", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { lines, context } = createStubContext();

    await createHashCommand(registry).execute(context, {
      location: fileLocation(root, { filename: "a.txt" }),
      algorithm: "sha1",
      "payload-kind": "js",
    });

    const expected = new Bun.CryptoHasher("sha1").update("hello").digest("hex");
    expect(lines[0]).toBe(`${expected}  ${join(root, "a.txt")}\n`);
  });

  test("rejects a location that is not a single entry", async () => {
    const { context } = createStubContext();

    await expect(
      createHashCommand(registry).execute(context, {
        location: fileLocation(root),
        algorithm: "sha256",
      }),
    ).rejects.toThrow("hash needs a single entry location");
  });
});
