import { describe, expect, test } from "bun:test";
import { targetKey } from "../../src/location/targetKey.ts";

describe("targetKey", () => {
  test("returns the key of an entry or container target", () => {
    expect(targetKey({ kind: "entry", key: "/a/b.txt" }, "delete")).toBe("/a/b.txt");
    expect(targetKey({ kind: "container", key: "/a" }, "delete")).toBe("/a");
  });

  test("rejects a pattern target, naming the command", () => {
    expect(() =>
      targetKey({ kind: "pattern", containerKey: "/a", pattern: "*" }, "delete"),
    ).toThrow("delete does not accept a pattern location");
  });
});
