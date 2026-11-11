#!/usr/bin/env bun

import { parse, printErrors, printHelp, printVersion } from "@bomb.sh/router";
import { cancel } from "@clack/prompts";

import { run as greet } from "@/commands/greet.ts";
import { app } from "@/router.ts";
import { endSectionError, endSectionSuccess, writeText } from "@/utils/logger.ts";

/**
 * Prints the root help text by parsing the built-in help flag.
 */
function showHelp(): void {
  const result = parse(app, { argv: ["--help"] });
  if (result.ok && result.method === "help") {
    writeText(printHelp(result));
  }
}

async function main(): Promise<void> {
  const result = parse(app, { argv: Bun.argv.slice(2) });

  if (!result.ok) {
    cancel(printErrors(result));
    endSectionError("Failed");
    process.exit(1);
  }

  if (result.method === "help") {
    writeText(printHelp(result));
    return;
  }

  if (result.method === "version") {
    writeText(printVersion(result));
    return;
  }

  switch (result.route) {
    case "/":
      showHelp();
      return;

    case "/greet": {
      const outcome = await greet(result.model);
      if (outcome.isErr()) {
        cancel(outcome.error);
        endSectionError("Failed");
        process.exit(1);
      }
      endSectionSuccess("Done");
      return;
    }
  }
}

main().catch((error: unknown) => {
  cancel(error instanceof Error ? error.message : String(error));
  endSectionError("Failed");
  process.exit(1);
});
