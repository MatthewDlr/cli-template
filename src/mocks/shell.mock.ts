import { ok, err } from "neverthrow";
import type { CommandResult } from "../utils/shell.ts";

/**
 * Creates a mock Ok CommandResult for a successful shell command.
 *
 * @param output - The stdout string to return. Defaults to empty string.
 * @returns An Ok CommandResult containing the output string.
 */
export function mockShellSuccess(output = ""): CommandResult {
  return ok(output);
}

/**
 * Creates a mock Err CommandResult for a failed shell command.
 *
 * @param error - The error message to return. Defaults to "Command failed".
 * @returns An Err CommandResult containing the error message.
 */
export function mockShellFailure(error = "Command failed"): CommandResult {
  return err(error);
}
