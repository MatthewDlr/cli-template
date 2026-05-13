import { intro, log, note, outro, spinner, tasks } from "@clack/prompts";
import type { Result } from "neverthrow";
import pc from "picocolors";
import type { ShellCommand } from "../types/ShellCommand.type";
import { runCommand, type CommandResult } from "./shell";

/**
 * Displays a bordered note box. Use for multi-line informational output
 * such as help text or command listings.
 *
 * @param content - Body text of the note.
 * @param title - Optional title shown at the top of the box.
 */
export function logNote(content: string, title?: string): void {
  note(content, title);
}

/**
 * Displays a cyan intro banner. Use for standard command sections.
 */
export function startSection(label: string): void {
  intro(pc.bgCyanBright(` ${label} `));
}

/**
 * Displays a yellow intro banner. Use for destructive or dangerous actions.
 */
export function dangerSection(label: string): void {
  intro(pc.bgYellowBright(` ${label} `));
}

/**
 * Displays a green outro banner signaling successful completion.
 */
export function endSectionSuccess(label: string): void {
  outro(pc.bgGreenBright(` ${label} `));
}

/**
 * Displays a red outro banner signaling failed completion.
 */
export function endSectionError(label: string): void {
  outro(pc.bgRedBright(` ${label} `));
}

/**
 * Runs an async Result-returning function wrapped in a spinner.
 * Shows a loading spinner while fn executes, stops with success or error state.
 *
 * @param loadingMessage - Message displayed while fn is running.
 * @param fn - Async function returning a Result.
 * @param successMessage - Message shown on success.
 * @returns The Result returned by fn.
 */
export async function withSpinner<T, E extends string>(
  loadingMessage: string,
  fn: () => Promise<Result<T, E>>,
  successMessage: string,
): Promise<Result<T, E>> {
  const spin = spinner();
  spin.start(loadingMessage);
  const result = await fn();
  if (result.isErr()) {
    spin.error(result.error);
  } else {
    spin.stop(successMessage);
  }
  return result;
}

/**
 * Runs an async Result-returning function with classic log output.
 * Logs a step before execution, then logs success or error on completion.
 *
 * @param loadingMessage - Message logged before fn runs.
 * @param fn - Async function returning a Result.
 * @param successMessage - Message shown on success.
 * @returns The Result returned by fn.
 */
export async function withLog<T, E extends string>(
  loadingMessage: string,
  fn: () => Promise<Result<T, E>>,
  successMessage: string,
): Promise<Result<T, E>> {
  log.step(loadingMessage);
  const result = await fn();
  if (result.isErr()) {
    log.error(result.error);
  } else {
    log.success(successMessage);
  }
  return result;
}

/**
 * Runs an array of shell commands as a visual task list.
 * Each command is displayed as a named row with its own spinner.
 * Stops on the first failure.
 *
 * @param commands - Array of ShellCommand objects to execute.
 * @returns A Map of command names to their CommandResult.
 */
export async function withTask(commands: ShellCommand[]): Promise<Map<string, CommandResult>> {
  const results = new Map<string, CommandResult>();

  try {
    await tasks(
      commands.map((command) => ({
        title: command.name,
        task: async () => {
          const result = await runCommand(command);
          results.set(command.name, result);
          if (result.isErr()) throw new Error(result.error);
          return result.value;
        },
      })),
    );
  } catch {
    // tasks() rejected because a command failed — results holds what ran so far
  }

  return results;
}
