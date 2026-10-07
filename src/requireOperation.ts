import type { IOProvider } from "@flowscripter/pluggable-io-framework-api";

type OptionalOperation = "list" | "setProperties" | "delete";

/**
 * Returns the provider's optional operation bound to it, or throws a clear
 * error when the protocol's provider does not implement it.
 */
export function requireOperation<T extends OptionalOperation>(
  provider: IOProvider,
  operation: T,
  protocol: string,
): NonNullable<IOProvider[T]> {
  const method = provider[operation];
  if (typeof method !== "function") {
    throw new Error(`${operation} is not supported by protocol "${protocol}"`);
  }
  return method.bind(provider) as NonNullable<IOProvider[T]>;
}
