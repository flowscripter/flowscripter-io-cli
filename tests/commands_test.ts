import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import copy from "../src/commands/copy.ts";
import deleteCommand from "../src/commands/delete.ts";
import getProperties from "../src/commands/get-properties.ts";
import hash from "../src/commands/hash.ts";
import list from "../src/commands/list.ts";
import move from "../src/commands/move.ts";
import setProperties from "../src/commands/set-properties.ts";
import { createStubContext } from "./testContext.ts";

let root: string;
let pluginsPath: string;

beforeAll(async () => {
  // Simulate `flowscripter-io-cli plugin add @flowscripter/io-plugin-filesystem`
  // by symlinking the sibling repo's checkout into a temp plugin store,
  // discovered purely via NpmPluginRepository - no npm install/publish
  // involved, and no dependency on it in this package's package.json.
  pluginsPath = await mkdtemp(join(tmpdir(), "flowscripter-io-cli-plugins-test-"));
  await mkdir(join(pluginsPath, "@flowscripter"), { recursive: true });
  await symlink(
    resolve(import.meta.dir, "..", "..", "io-plugin-filesystem"),
    join(pluginsPath, "@flowscripter", "io-plugin-filesystem"),
    "junction",
  );
  process.env.FLOWSCRIPTER_IO_CLI_PLUGINS_PATH = pluginsPath;
});

afterAll(async () => {
  delete process.env.FLOWSCRIPTER_IO_CLI_PLUGINS_PATH;
  await rm(pluginsPath, { recursive: true, force: true });
});

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "flowscripter-io-cli-test-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("list", () => {
  test("prints one JSON line per item", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { lines, context } = createStubContext();

    await list.execute(context, { path: root });

    expect(lines.length).toBe(1);
    expect(JSON.parse(lines[0]!).path).toBe("a.txt");
  });
});

describe("get-properties", () => {
  test("prints properties as JSON", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { lines, context } = createStubContext();

    await getProperties.execute(context, { path: join(root, "a.txt") });

    expect(JSON.parse(lines[0]!).size).toBe(5);
  });
});

describe("set-properties", () => {
  test("applies mode", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context } = createStubContext();

    await setProperties.execute(context, { path: join(root, "a.txt"), mode: 0o600 });

    const { lines, context: getPropertiesContext } = createStubContext();
    await getProperties.execute(getPropertiesContext, { path: join(root, "a.txt") });
    const properties = JSON.parse(lines[0]!);
    if (process.platform !== "win32") {
      expect(properties.properties.mode & 0o777).toBe(0o600);
    }
  });
});

describe("delete", () => {
  test("removes a file", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context } = createStubContext();

    await deleteCommand.execute(context, { path: join(root, "a.txt") });

    const { lines, context: listContext } = createStubContext();
    await list.execute(listContext, { path: root });
    expect(lines.length).toBe(0);
  });
});

describe("copy", () => {
  test("copies a file", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context } = createStubContext();

    await copy.execute(context, { source: join(root, "a.txt"), destination: join(root, "b.txt") });

    const { lines } = createStubContext();
    const { context: getPropsContext, lines: getPropsLines } = createStubContext();
    await getProperties.execute(getPropsContext, { path: join(root, "b.txt") });
    expect(JSON.parse(getPropsLines[0]!).size).toBe(5);
    expect(lines).toEqual([]);
  });
});

describe("move", () => {
  test("moves a file", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { context } = createStubContext();

    await move.execute(context, { source: join(root, "a.txt"), destination: join(root, "b.txt") });

    const { lines, context: listContext } = createStubContext();
    await list.execute(listContext, { path: root });
    expect(lines.map((line) => JSON.parse(line).path)).toEqual(["b.txt"]);
  });
});

describe("hash", () => {
  test("hashes a file with the default algorithm", async () => {
    await writeFile(join(root, "a.txt"), "hello");
    const { lines, context } = createStubContext();

    await hash.execute(context, { path: join(root, "a.txt"), algorithm: "sha256" });

    const expected = new Bun.CryptoHasher("sha256").update("hello").digest("hex");
    expect(lines[0]).toBe(`${expected}  ${join(root, "a.txt")}\n`);
  });
});
