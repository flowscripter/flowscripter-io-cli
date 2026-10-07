import { describe, expect, test } from "bun:test";
import { ComplexValueTypeName, ValueTypeName } from "@flowscripter/dynamic-cli-framework";
import { z } from "zod";
import { zodToComplexOption } from "../src/zodToComplexOption.ts";

describe("zodToComplexOption", () => {
  test("converts scalar fields to typed options", () => {
    const properties = zodToComplexOption(
      z.object({ path: z.string(), count: z.number(), force: z.boolean() }),
    );

    expect(properties).toEqual([
      { name: "path", description: "path", type: ValueTypeName.STRING },
      { name: "count", description: "count", type: ValueTypeName.NUMBER },
      { name: "force", description: "force", type: ValueTypeName.BOOLEAN },
    ]);
  });

  test("marks optional and defaulted fields as optional", () => {
    const properties = zodToComplexOption(
      z.object({ path: z.string().default("/"), filename: z.string().optional() }),
    );

    expect(properties).toEqual([
      { name: "path", description: "path", type: ValueTypeName.STRING, isOptional: true },
      { name: "filename", description: "filename", type: ValueTypeName.STRING, isOptional: true },
    ]);
  });

  test("uses a field's description when it has one", () => {
    const properties = zodToComplexOption(
      z.object({ path: z.string().describe("Folder path").optional() }),
    );

    expect(properties).toEqual([
      { name: "path", description: "Folder path", type: ValueTypeName.STRING, isOptional: true },
    ]);
  });

  test("converts fields marked secret to secret options", () => {
    const properties = zodToComplexOption(
      z.object({
        password: z.string().optional().meta({ secret: true }),
        token: z.string().meta({ secret: true }).optional(),
      }),
    );

    expect(properties).toEqual([
      { name: "password", description: "password", type: ValueTypeName.SECRET, isOptional: true },
      { name: "token", description: "token", type: ValueTypeName.SECRET, isOptional: true },
    ]);
  });

  test("converts enum fields to strings with allowable values", () => {
    const properties = zodToComplexOption(z.object({ method: z.enum(["PUT", "POST"]) }));

    expect(properties).toEqual([
      {
        name: "method",
        description: "method",
        type: ValueTypeName.STRING,
        allowableValues: ["PUT", "POST"],
      },
    ]);
  });

  test("converts nested objects and arrays of objects to complex options", () => {
    const properties = zodToComplexOption(
      z.object({
        auth: z.object({ username: z.string() }),
        headers: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
      }),
    );

    expect(properties).toEqual([
      {
        name: "auth",
        description: "auth",
        type: ComplexValueTypeName.COMPLEX,
        properties: [{ name: "username", description: "username", type: ValueTypeName.STRING }],
      },
      {
        name: "headers",
        description: "headers",
        type: ComplexValueTypeName.COMPLEX,
        isOptional: true,
        isArray: true,
        properties: [
          { name: "name", description: "name", type: ValueTypeName.STRING },
          { name: "value", description: "value", type: ValueTypeName.STRING },
        ],
      },
    ]);
  });

  test("accepts a refined object schema", () => {
    const properties = zodToComplexOption(
      z.object({ path: z.string() }).refine((value) => value.path !== ""),
    );

    expect(properties).toEqual([{ name: "path", description: "path", type: ValueTypeName.STRING }]);
  });

  test("rejects unsupported field types", () => {
    expect(() => zodToComplexOption(z.object({ when: z.date() }))).toThrow(
      'Unsupported schema type "date" for "when"',
    );
    expect(() => zodToComplexOption(z.object({ tags: z.array(z.string()) }))).toThrow(
      'Unsupported array element type "string" for "tags"',
    );
  });

  test("rejects a non-object schema", () => {
    expect(() => zodToComplexOption(z.string())).toThrow('Expected an object schema, got "string"');
  });
});
