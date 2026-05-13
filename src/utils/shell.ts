import { $ } from "bun";
import { err, ok, type Result } from "neverthrow";
import type { ShellCommand } from "../types/ShellCommand.type";
import type { ShellCommandsOptions } from "../types/ShellCommandsOptions.type";

export type CommandResult = Result<string, string>;

/**
 * Executes a series of shell commands in sequence.
 * @param commands An array of ShellCommand objects to execute.
 * @param options Optional ShellCommandsOptions to configure the execution of the commands.
 * @returns a Map of command names to their execution results.
 */
export async function runShellCommands(
  commands: ShellCommand[],
  options?: ShellCommandsOptions,
): Promise<Map<string, CommandResult>> {
  const results = new Map<string, CommandResult>();

  for (const command of commands) {
    const result = await runCommand(command);
    results.set(command.name, result);

    if (result.isErr() && options?.stopOnError) {
      break;
    }
  }

  return results;
}

/**
 * Executes a single shell command.
 * @param command A ShellCommand object to execute.
 * @returns A CommandResult representing the success or failure of the command execution.
 */
export async function runCommand(command: ShellCommand): Promise<CommandResult> {
  const result = await $`${[...command.command]}`.quiet().nothrow();

  if (result.exitCode !== 0) {
    return err(result.stderr.toString());
  }

  if (command.isValid) {
    const validationResult = command.isValid(result);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }
    return ok(validationResult.value);
  }

  return ok(result.stdout.toString());
}
