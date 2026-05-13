import { ok, type Result } from "neverthrow";
import { logNote } from "../utils/logger";
import { COMMAND_REGISTRY } from "./registry";

type CommandEntry = { name: string; description?: string };

function hasDescription(mod: unknown): mod is { description: string } {
  if (typeof mod !== "object" || mod === null) return false;
  if (!("description" in mod)) return false;
  return typeof mod.description === "string";
}

/**
 * Loads all commands from the registry, filters out `help` itself, and
 * returns a sorted list of command entries with their names and descriptions.
 *
 * @param registry - Map of file paths to lazy-import functions.
 * @returns Sorted array of command entries.
 */
export async function listCommands(registry: Record<string, () => Promise<unknown>>): Promise<CommandEntry[]> {
  const entries = await Promise.all(
    Object.entries(registry).map(async ([path, loader]) => {
      const name = path.replace(/^.*\//, "").replace(/\.ts$/, "");
      const mod = await loader();
      return { name, description: hasDescription(mod) ? mod.description : undefined };
    }),
  );

  return entries.filter((entry) => entry.name !== "help").sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Formats a list of command entries into a padded table string.
 *
 * @param commands - Sorted array of command entries.
 * @returns A multi-line string with names and descriptions aligned.
 */
export function formatCommands(commands: CommandEntry[]): string {
  if (commands.length === 0) return "(no commands found)";
  const maxLen = Math.max(...commands.map((c) => c.name.length));
  return commands
    .map(({ name, description }) => (description ? `${name.padEnd(maxLen + 2)}${description}` : name))
    .join("\n");
}

export const description = "List all available commands";

/**
 * Runs the `help` command, printing all available commands and their descriptions.
 *
 * @returns Ok on success.
 */
export async function run(): Promise<Result<void, string>> {
  const commands = await listCommands(COMMAND_REGISTRY);
  logNote(formatCommands(commands), "Available commands");
  return ok(undefined);
}
