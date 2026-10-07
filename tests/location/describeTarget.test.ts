import { describe, expect, test } from "bun:test";
import { describeTarget } from "../../src/location/describeTarget.ts";

describe("describeTarget", () => {
  test("describes entry, container and pattern targets", () => {
    expect(describeTarget({ kind: "entry", key: "/a/b.txt" })).toBe("/a/b.txt");
    expect(describeTarget({ kind: "container", key: "/a" })).toBe("/a");
    expect(describeTarget({ kind: "pattern", containerKey: "/a", pattern: "*.txt" })).toBe(
      "*.txt in /a",
    );
  });
});
