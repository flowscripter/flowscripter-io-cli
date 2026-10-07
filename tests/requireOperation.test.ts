import { describe, expect, test } from "bun:test";
import type { IOProvider } from "@flowscripter/pluggable-io-framework-api";
import { requireOperation } from "../src/requireOperation.ts";

describe("requireOperation", () => {
  test("returns the operation bound to the provider", async () => {
    const deleted: string[] = [];
    const provider = {
      prefix: "x:",
      async delete(this: { prefix: string }, path: string) {
        deleted.push(this.prefix + path);
      },
    } as unknown as IOProvider;

    await requireOperation(provider, "delete", "file")("a");

    expect(deleted).toEqual(["x:a"]);
  });

  test("names the protocol when the operation is not implemented", () => {
    expect(() => requireOperation({} as IOProvider, "list", "https")).toThrow(
      'list is not supported by protocol "https"',
    );
  });
});
