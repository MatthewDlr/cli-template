import { ok, type Result } from "neverthrow";

import { logNote } from "@/utils/logger.ts";

/**
 * The validated model the router builds for the `greet` command.
 */
export type GreetModel = {
  name: string;
  shout: boolean;
};

/**
 * Builds the greeting rendered by the `greet` command.
 *
 * @param model - The validated model produced by the router.
 * @returns The greeting sentence, uppercased when `shout` is set.
 */
export function formatGreeting({ name, shout }: GreetModel): string {
  const greeting = `Hello, ${name}!`;
  return shout ? greeting.toUpperCase() : greeting;
}

/**
 * Runs the `greet` command.
 *
 * @param model - The validated model produced by the router.
 * @returns Ok on success.
 */
export async function run(model: GreetModel): Promise<Result<void, string>> {
  logNote(formatGreeting(model));
  return ok(undefined);
}
