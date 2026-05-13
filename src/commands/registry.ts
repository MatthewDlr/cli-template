import type { CommandRegistry } from "../utils/command-loader";

/**
 * Top-level command registry. Each entry maps a command name to a lazy
 * `import()` of the module under `src/commands/<name>.ts`.
 *
 * Add a new command here when you create `src/commands/<name>.ts`.
 */
export const COMMAND_REGISTRY: CommandRegistry = {
  help: () => import("./help"),
  version: () => import("./version"),
};
