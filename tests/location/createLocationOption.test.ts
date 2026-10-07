import { describe, expect, test } from "bun:test";
import { ComplexValueTypeName, ValueTypeName } from "@flowscripter/dynamic-cli-framework";
import type { ProviderRegistry } from "@flowscripter/pluggable-io-framework";
import type { IOProviderFactory } from "@flowscripter/pluggable-io-framework-api";
import { z } from "zod";
import { createLocationOption } from "../../src/location/createLocationOption.ts";

const factories: Record<string, Partial<IOProviderFactory>> = {
  file: { locationSchema: z.object({ path: z.string().default("/") }) },
  s3: {
    locationSchema: z.object({
      bucket: z.string(),
      secretAccessKey: z.string().optional().meta({ secret: true }),
    }),
  },
};

const registry = {
  getProtocols: () => Object.keys(factories),
  getFactory: (protocol: string) => factories[protocol],
} as unknown as ProviderRegistry;

describe("createLocationOption", () => {
  test("has a protocol property and one optional group per protocol", () => {
    const option = createLocationOption(registry, "source", "Source location");

    expect(option.name).toBe("source");
    expect(option.type).toBe(ComplexValueTypeName.COMPLEX);
    expect(option.properties).toEqual([
      {
        name: "protocol",
        description: "Protocol of the location",
        type: ValueTypeName.STRING,
        allowableValues: ["file", "s3"],
      },
      {
        name: "file",
        description: "Location fields for the file protocol",
        type: ComplexValueTypeName.COMPLEX,
        isOptional: true,
        properties: [
          { name: "path", description: "path", type: ValueTypeName.STRING, isOptional: true },
        ],
      },
      {
        name: "s3",
        description: "Location fields for the s3 protocol",
        type: ComplexValueTypeName.COMPLEX,
        isOptional: true,
        properties: [
          { name: "bucket", description: "bucket", type: ValueTypeName.STRING },
          {
            name: "secretAccessKey",
            description: "secretAccessKey",
            type: ValueTypeName.SECRET,
            isOptional: true,
          },
        ],
      },
    ]);
  });

  test("validates the selected protocol's group against its location schema", () => {
    const { validate } = createLocationOption(registry, "source", "Source location");

    expect(validate?.({ protocol: "file" })).toBeUndefined();
    expect(validate?.({ protocol: "s3", s3: { bucket: "b" } })).toBeUndefined();
    expect(validate?.({ protocol: "s3", file: { path: "/" } })).toStartWith(
      "Invalid s3 location: bucket:",
    );
    expect(validate?.({ protocol: "ftp" })).toBe('No provider installed for protocol "ftp"');
  });
});
