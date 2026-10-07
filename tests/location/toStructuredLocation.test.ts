import { describe, expect, test } from "bun:test";
import { toStructuredLocation } from "../../src/location/toStructuredLocation.ts";

describe("toStructuredLocation", () => {
  test("takes the selected protocol's group as the location", () => {
    expect(
      toStructuredLocation({ protocol: "file", file: { path: "/a" }, s3: { bucket: "b" } }),
    ).toEqual({ protocol: "file", location: { path: "/a" } });
  });

  test("uses an empty location when the protocol's group is absent", () => {
    expect(toStructuredLocation({ protocol: "file" })).toEqual({ protocol: "file", location: {} });
  });
});
