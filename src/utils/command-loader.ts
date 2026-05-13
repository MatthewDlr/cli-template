import { err, ok, type Result } from "neverthrow";
import type { Command } from "../types/Command.type";

/**
 * A map of module paths or command names to lazy-import functions.
 * Accepts both path-keyed output from `import.meta.glob` (e.g.
 * `"./src/commands/version.ts"`) and plain name-keyed objects (e.g.
 * `"version"`) — useful for passing plain objects in tests.
 */
export type CommandRegistry = Record<string, () => Promise<unknown>>;

/**
 * Type guard that checks whether an unknown value satisfies the Command shape.
 *
 * @param mod - The value to check, typically the result of a dynamic import.
 * @returns `true` if `mod` is a Command, narrowing the type accordingly.
 */
export function isCommand(mod: unknown): mod is Command {
  if (typeof mod !== "object" || mod === null) return false;
  if (!("run" in mod)) return false;
  return typeof mod.run === "function";
}

/**
 * Looks up and loads a command from the registry.
 *
 * Matching is by filename: a key matches `name` if it equals `name` exactly,
 * or ends with `/<name>.ts`. This lets path-keyed glob registries
 * (`"./src/commands/version.ts"`) and name-keyed registries (`"version"`)
 * both resolve correctly.
 *
 * @param name - The command name (e.g. `"version"`).
 * @param registry - Map of paths or names to lazy-import functions.
 * @returns Ok with the loaded Command, or Err with a human-readable message.
 */
export async function loadCommand(name: string, registry: CommandRegistry): Promise<Result<Command, string>> {
  const key = Object.keys(registry).find((k) => k === name || k.endsWith(`/${name}.ts`));
  const loader = key !== undefined ? registry[key] : undefined;

  if (!loader) {
    return err(`Unknown command: "${name}". Run --help for usage.`);
  }

  let mod: unknown;
  try {
    mod = await loader();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(`Failed to load command "${name}": ${message}`);
  }

  if (!isCommand(mod)) {
    return err(`Command "${name}" does not export a valid run function. Check src/commands/${name}.ts.`);
  }

  return ok(mod);
}
