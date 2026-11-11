import { ok, type Result } from "neverthrow";

import { withSpinner } from "@/utils/logger.ts";

import { version } from "../../package.json";

/**
 * Runs the `version` command, printing the current CLI version.
 *
 * @returns Ok on success. The version string is sourced from package.json at
 * compile time, so this never fails.
 */
export async function run(): Promise<Result<void, string>> {
  return withSpinner("Reading version...", async () => ok(undefined), `template-cli v${version}`);
}
