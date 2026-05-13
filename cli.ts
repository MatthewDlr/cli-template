#!/usr/bin/env bun

import { cancel } from "@clack/prompts";
import { loadCommand } from "./src/utils/command-loader.ts";
import { endSectionError, endSectionSuccess } from "./src/utils/logger.ts";

const command = Bun.argv[2];

if (!command) {
  cancel("No command provided. Run --help for usage.");
  process.exit(1);
}

// import.meta.glob is resolved by Bun's bundler at compile time, ensuring every file under src/commands/ is included in the compiled binary.
const loaded = await loadCommand(command, import.meta.glob("./src/commands/*.ts"));

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
