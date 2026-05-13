import type { Result } from "neverthrow";

/**
 * The shape every command module in src/commands/ must satisfy.
 * The CLI loader discovers commands by filename and validates this shape at runtime.
 */
export type Command = {
  run: (args: string[]) => Promise<Result<void, string>>;
  /** Reserved for --help output. */
  description?: string;
};
