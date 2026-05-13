import { err, ok } from "neverthrow";
import type { Command } from "../types/Command.type";

/**
 * Creates a mock Command whose `run` resolves to Ok.
 *
 * @returns A Command that always succeeds.
 */
export function mockCommandSuccess(): Command {
  return { run: async () => ok(undefined) };
}

/**
 * Creates a mock Command whose `run` resolves to Err.
 *
 * @param error - The error message to return. Defaults to "Command failed".
 * @returns A Command that always fails with the given message.
 */
export function mockCommandFailure(error = "Command failed"): Command {
  return { run: async () => err(error) };
}
