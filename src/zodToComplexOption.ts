import {
  type ComplexOption,
  ComplexValueTypeName,
  type Option,
  ValueTypeName,
} from "@flowscripter/dynamic-cli-framework";
import type { ZodType } from "zod";

interface ZodNode {
  readonly def: {
    readonly type: string;
    readonly innerType?: ZodNode;
    readonly element?: ZodNode;
    readonly entries?: Record<string, string>;
  };
  readonly shape?: Record<string, ZodNode>;
  meta(): Record<string, unknown> | undefined;
}

interface Unwrapped {
  readonly node: ZodNode;
  readonly isOptional: boolean;
  readonly isSecret: boolean;
}

function unwrap(node: ZodNode): Unwrapped {
  let isOptional = false;
  let isSecret = node.meta()?.secret === true;
  while (node.def.type === "optional" || node.def.type === "default") {
    isOptional = true;
    node = node.def.innerType as ZodNode;
    isSecret ||= node.meta()?.secret === true;
  }
  return { node, isOptional, isSecret };
}

function toOption(name: string, schema: ZodNode): Option | ComplexOption {
  const { node, isOptional, isSecret } = unwrap(schema);
  const base = { name, description: name, ...(isOptional ? { isOptional } : {}) };
  switch (node.def.type) {
    case "string":
      return { ...base, type: isSecret ? ValueTypeName.SECRET : ValueTypeName.STRING };
    case "number":
      return { ...base, type: isSecret ? ValueTypeName.SECRET : ValueTypeName.NUMBER };
    case "boolean":
      return { ...base, type: ValueTypeName.BOOLEAN };
    case "enum":
      return {
        ...base,
        type: ValueTypeName.STRING,
        allowableValues: Object.values(node.def.entries ?? {}),
      };
    case "object":
      return { ...base, type: ComplexValueTypeName.COMPLEX, properties: toOptions(node) };
    case "array": {
      const element = unwrap(node.def.element as ZodNode).node;
      if (element.def.type !== "object") {
        throw new Error(`Unsupported array element type "${element.def.type}" for "${name}"`);
      }
      return {
        ...base,
        type: ComplexValueTypeName.COMPLEX,
        isArray: true,
        properties: toOptions(element),
      };
    }
    default:
      throw new Error(`Unsupported schema type "${node.def.type}" for "${name}"`);
  }
}

function toOptions(node: ZodNode): ReadonlyArray<Option | ComplexOption> {
  return Object.entries(node.shape ?? {}).map(([name, child]) => toOption(name, child));
}

/**
 * Converts the fields of a Zod object schema into `ComplexOption` properties:
 * strings, numbers and booleans become single-value options (`SECRET` when
 * marked `.meta({ secret: true })`), enums become strings with allowable
 * values, nested objects become nested `ComplexOption`s and arrays of objects
 * become array `ComplexOption`s. Optional and defaulted fields are optional.
 */
export function zodToComplexOption(schema: ZodType): ReadonlyArray<Option | ComplexOption> {
  const { node } = unwrap(schema as unknown as ZodNode);
  if (node.def.type !== "object") {
    throw new Error(`Expected an object schema, got "${node.def.type}"`);
  }
  return toOptions(node);
}
