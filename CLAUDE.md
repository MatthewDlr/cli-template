# cli CLI

## Introduction

This project aim to be a CLI tool to facilitate the life of developers and people in tech.

## Tech Stack

- Bun as the runtime environment with argument parsing, shell scripting and testing capabilities
- TypeScript 7.0
- Oxlint and Oxfmt
- Clack Prompt to ask for user input in the terminal and display interactive prompts
- Picocolor to display colored text in the terminal
- Neverthrow for functional error handling

## Guidelines

After all feature dev, you must run `bun fmt` to format the code, `bun lint` to check for linting errors and `bun test` to run the tests. You must make sure everything passes before finishing work.

**You are strictly prohibited from editing `.oxlintrc.jsonc` or `.oxfmtrc.json`.** These files define the quality standards for the project and must not be modified to silence errors. If a linter or formatter error occurs, you must address the root cause in the source code — never work around it by relaxing or disabling a rule.

### Typescript guidelines

- never use `any` type, always try to be as specific as possible with types, and use type guards when necessary.
- never use `as` keyword to cast types, always try to use type guards or type inference to get the correct types. The only exception is `as const`.
- exported functions must have jsdoc with @param, @returns and so on.

### Argument parsing

For parsing arguments, use Bun. Here's an example below:

```ts
import { parseArgs } from "util";

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    flag1: {
      type: "boolean",
    },
    flag2: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

console.log(values);
console.log(positionals);
```

Each command receives its remaining arguments as `args: string[]` via its `run(args)` parameter — `cli.ts` strips the executable and command name before passing them down. Use `parseArgs({ args, strict: true, options: { ... } })` directly on that slice. For subcommands, dispatch on `args[0]` and pass `args.slice(1)` to the next `run()`.

Bun docs: <https://bun.com/docs/guides/process/argv#parse-command-line-arguments>

### Shell

Never use `$` from Bun or any raw shell API directly in commands. Always go through the helpers in `src/utils/shell.ts`:

- `runCommand(command)`: runs a single `ShellCommand`, returns `CommandResult` (`Result<string, string>`)
- `runShellCommands(commands, options?)`: runs an array sequentially, returns `Map<string, CommandResult>`. Accepts `{ stopOnError?: boolean }`.

```ts
import { runCommand, runShellCommands } from "../utils/shell";

const result = await runCommand({ name: "list", command: ["ls", "-la"] });

const results = await runShellCommands(
  [
    { name: "install", command: ["bun", "install"] },
    { name: "build", command: ["bun", "run", "build"] },
  ],
  { stopOnError: true },
);
```

A `ShellCommand` has a required `name` (used as the display label and map key) and `command` (string array). It also accepts an optional `isValid` function to run custom validation on the output beyond the exit code.

### Shell Output

Never print raw command output to the terminal. All terminal feedback must go through the helpers in `src/utils/logger.ts`. Never import `spinner`, `intro`, `outro`, or `log` from `@clack/prompts` directly in command files. If the user asks to log something in a way that's not done already, maybe it's worth to add it in `logger.ts` as a reusable helper.

#### Command sections

Wrap every command with an intro and outro only if the user asks for it

```ts
import { startSection, dangerSection, endSectionSuccess, endSectionError } from "../utils/logger";

startSection("Install dependencies"); // cyan — standard actions
dangerSection("Delete branches"); // yellow — destructive actions

endSectionSuccess("Done"); // green — on success
endSectionError("Something went wrong"); // red — on failure
```

#### Running commands with feedback

Use one of three wrappers depending on the context:

| Helper                             | When to use                                        |
| ---------------------------------- | -------------------------------------------------- |
| `withSpinner(msg, fn, successMsg)` | Long-running operations only (see below)           |
| `withLog(msg, fn, successMsg)`     | Default for single async operations                |
| `withTask(commands)`               | Multiple shell commands shown as a named task list |

**Spinner vs log:** reserve `withSpinner` for operations that are genuinely slow and unpredictable — network I/O, remote git commands (`git fetch`, `git push`, `git pull`), package installs. For anything that completes in under a second (reading a file, a local git command, simple computation), use `withLog` instead. A spinner that flashes and disappears instantly is worse than no spinner.

```ts
import { withSpinner, withLog, withTask } from "../utils/logger";
import { runCommand, runShellCommands } from "../utils/shell";

// Single operation with a spinner
const result = await withSpinner(
  "Installing dependencies...",
  () => runCommand({ name: "install", command: ["bun", "install"] }),
  "Dependencies installed",
);

// Multiple commands shown as a task list (stops on first failure)
const results = await withTask([
  { name: "Install dependencies", command: ["bun", "install"] },
  { name: "Build project", command: ["bun", "run", "build"] },
]);
```

#### User input

For prompts (confirmation, text input, etc.) use `@clack/prompts` directly:

```ts
import { text, isCancel } from "@clack/prompts";

const name = await text({ message: "What is your name?", placeholder: "Jane Doe" });

if (isCancel(name)) {
  process.exit(0);
}
```

Clack Best Practices: <https://bomb.sh/docs/clack/guides/best-practices/>
Clack Examples: <https://bomb.sh/docs/clack/guides/examples/>

### Error Handling

Use `neverthrow` library to handle errors in a functional way. Never throw errors, always return them as a result. This will make it easier to handle errors and avoid unhandled promise rejections.

```ts
import { err, ok, Result } from "neverthrow";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Cannot divide by zero");
  }
  return ok(a / b);
}
```

If you need more information about how to use `neverthrow`, read the documentation here: <https://raw.githubusercontent.com/supermacro/neverthrow/refs/heads/master/README.md>.

### Project scaffolding

All code must be organized in a way that makes it easy to maintain and scale.
The folder `utils` must contain all the utility functions that can be reused across the project, such as functions for running shell commands, handling git operations, etc. All files in this folder are meant to be imported and used by commands or other utility files, but not to be run directly from the cli. Use one file per feature. Each file must have a test file (`<filename>.spec.ts`) that covers all the functions in it.

The folder `commands` must contain all the command files that define the CLI commands. The structure of this folder must reflect the structure of the CLI commands. For example, if you have a command `new project`, you can create a file `new.ts` that contains the logic for calling the subcommands, and a folder `new` that contains the logic for the subcommands. So that we know that every file in the `new` folder is associated to the `new` command.

structure example:

```bash
- commands
  - new.ts
  - new
    - project.ts: called by `new project` command
    - branch.ts: called by `new branch` command
  - node.ts
  - node
    - install.ts: called by `node install` command
    - update.ts: called by `node update` command
```

### Command design

Commands are kept self-contained and uniform:

- **Every command exports a single `run` function** with the signature `(args: string[]) => Promise<Result<void, string>>`. This uniform interface is what the loader expects.

- **Commands are self-contained.** A command file must not import from another command file. Shared logic belongs in `utils/`.

- **Subcommands follow the same pattern.** A parent command (`new.ts`) holds its own registry of subcommands (`new/project.ts`, `new/branch.ts`). The top-level router does not need to know about subcommands.

### Command convention

Every file in `src/commands/` must export a `run` function matching the `Command` type from `src/types/Command.type.ts`, and must be registered in `src/commands/registry.ts`.

The registry is a plain object of lazy imports:

```ts
// src/commands/registry.ts
import type { CommandRegistry } from "../utils/command-loader";

export const COMMAND_REGISTRY: CommandRegistry = {
  help: () => import("./help"),
  version: () => import("./version"),
};
```

To add a command:

1. Create `src/commands/<name>.ts` exporting `run` (and optionally `description`).
2. Add one line to `COMMAND_REGISTRY`: `<name>: () => import("./<name>"),`.

For sub-commands, the parent command file holds its own registry and dispatches via `loadCommand(args[0], SUB_REGISTRY)`. Keep each sub-registry next to the parent (e.g. `BRANCH_REGISTRY` alongside `COMMAND_REGISTRY` in `registry.ts`, or a separate `branch/registry.ts`).

The loader (`src/utils/command-loader.ts`) resolves the registry entry and validates the loaded module's shape. If the name is missing the user sees "Unknown command". If the file exists but does not export a valid `run` function, a shape error is shown.

Why a registry instead of filesystem auto-discovery? Bun's `bun build --compile` step needs every import to be statically visible to the bundler. A central registry of `() => import("./...")` calls satisfies that *and* works identically when running from source.

### Testing

Use `bun test` to run tests.
Every function must have a test that covers it, and every edge case must be tested as well.

#### Structure

Group tests by function using `describe`. Pass the function itself as the first argument — Bun infers the block title from `function.name`, so there is no need to repeat it in the test names.

```ts
import { describe, test, expect } from "bun:test";
import { myFunction } from "./myFile.ts";

describe(myFunction, () => {
  test("returns the expected value for valid input", () => {
    // ...
  });
});
```

Within each `describe` block, order tests as follows:

1. **Happy path** — the primary success case
2. **Error cases** — invalid input, failures, rejections
3. **Edge cases** — boundary conditions, optional behaviour, alternate valid inputs

#### Style

Tests must follow the AAA pattern (Arrange, Act, Assert). Comments need to be visible.

```ts
test("returns Err when the command fails", async () => {
  // Arrange
  const command: ShellCommand = { name: "fail", command: ["false"] };

  // Act
  const result = await runCommand(command);

  // Assert
  expect(result.isErr()).toBe(true);
});
```

Tests must not be flaky and must not rely on external factors such as network or file system. Use mocks and stubs to isolate the code being tested. Mocks should be stored in the `mocks` folder and must be reusable across different test files.

When testing multiple similar inputs, use parameterized tests to avoid duplication.
