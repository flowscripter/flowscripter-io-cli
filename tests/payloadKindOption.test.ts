import { describe, expect, test } from "bun:test";
import { PayloadKind } from "@flowscripter/pluggable-io-framework-api";
import { payloadKindOption, toPayloadKind } from "../src/payloadKindOption.ts";

describe("payloadKindOption", () => {
  test("defaults to auto and allows auto, js and native", () => {
    expect(payloadKindOption.defaultValue).toBe("auto");
    expect(payloadKindOption.allowableValues).toEqual(["auto", "js", "native"]);
  });
});

describe("toPayloadKind", () => {
  test("leaves auto to the registry and passes an explicit kind", () => {
    expect(toPayloadKind("auto")).toBeUndefined();
    expect(toPayloadKind(undefined)).toBeUndefined();
    expect(toPayloadKind("js")).toBe(PayloadKind.Js);
    expect(toPayloadKind("native")).toBe(PayloadKind.Native);
  });
});
