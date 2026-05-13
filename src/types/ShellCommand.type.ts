import type { $ } from "bun";
import type { Result } from "neverthrow";

/**
 * A function that can be executed in Bun's shell
 */
export type ShellCommand = {
  /** Friendly name of the function to run */
  name: string;

  /** Array representing the shell command to execute */
  command: string[];

  /**
   * Validation expression that will be performed against the command output (stdout), if not an error.
   * @output The output of the command to validate
   * @returns A success or error message based on the validation result
   */
  isValid?(output: $.ShellOutput): Result<string, string>;
};
