#!/usr/bin/env bun

import { cancel } from "@clack/prompts";
import { COMMAND_REGISTRY } from "./src/commands/registry.ts";
import { loadCommand } from "./src/utils/command-loader.ts";
import { endSectionError, endSectionSuccess } from "./src/utils/logger.ts";

async function main(): Promise<void> {
  const command = Bun.argv[2];

  if (!command) {
    cancel("No command provided. Run `help` for usage.");
    process.exit(1);
  }

  const loaded = await loadCommand(command, COMMAND_REGISTRY);

  if (loaded.isErr()) {
    cancel(loaded.error);
    endSectionError("Failed");
    process.exit(1);
  }

  const result = await loaded.value.run(Bun.argv.slice(3));

  if (result.isErr()) {
    cancel(result.error);
    endSectionError("Failed");
    process.exit(1);
  }

  endSectionSuccess("Done");
}

main().catch((error: unknown) => {
  cancel(error instanceof Error ? error.message : String(error));
  endSectionError("Failed");
  process.exit(1);
});
