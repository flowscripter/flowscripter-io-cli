import { expect, test } from "bun:test";
import { join } from "node:path";

const script = `
import { readFileSync } from "node:fs";
let loads = 0;
Bun.plugin({
  name: "count-native-loads",
  setup(build) {
    build.onLoad({ filter: /flowscripter-io-cli-hash-native.*[\\\\/]src[\\\\/]lib\\.ts$/ }, (args) => {
      loads++;
      return { contents: readFileSync(args.path, "utf8"), loader: "ts" };
    });
  },
});
await import(process.argv[1]);
process.stdout.write(String(loads));
`;

test("importing the hash command does not load the native hasher library", async () => {
  const hashModule = join(import.meta.dir, "../../src/commands/hash.ts");
  const proc = Bun.spawn([process.execPath, "--eval", script, hashModule], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, exitCode] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
  expect(exitCode).toBe(0);
  expect(stdout.trim()).toBe("0");
});
