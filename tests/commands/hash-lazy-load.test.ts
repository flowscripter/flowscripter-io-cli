import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("importing the hash command does not resolve or download the native library", async () => {
  const home = mkdtempSync(join(tmpdir(), "hash-lazy-load-"));
  try {
    const hashModule = join(import.meta.dir, "../../src/commands/hash.ts");
    const proc = Bun.spawn(
      [process.execPath, "--eval", "await import(process.argv[1])", hashModule],
      {
        env: { ...process.env, HOME: home, USERPROFILE: home },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    expect(await proc.exited).toBe(0);
    expect(existsSync(join(home, ".flowscripter"))).toBe(false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
