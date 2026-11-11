# Project Guidelines

## Introduction

This project is a CLI tool that makes developers' lives easier. It is also the template every new CLI starts from, so uniformity and readability matter more than cleverness.

## Tech Stack

| Layer      | Choice                          | Notes                                                |
| ---------- | ------------------------------- | ---------------------------------------------------- |
| Runtime    | Bun 1.4                         | Package manager, test runner, bundler, shell         |
| Language   | TypeScript 7 via `tsrs`         | Native-speed type checking (`bun typecheck`)         |
| Errors     | `neverthrow`                    | `Result<T, E>` everywhere; no `throw`                |
| Prompts    | `@clack/prompts`                | Interactive input, spinners, notes                   |
| Terminal   | `picocolors` + `terminal-link`  | Colors and clickable links                           |
| Validation | `zod`                           | Runtime schema validation                            |
| Linter     | Oxlint 1.93 + `oxlint-tsgolint` | Type-aware rules, agent reporter                     |
| Formatter  | Oxfmt 0.78                      | 100 columns, sorted imports, sorted scripts          |
| Tests      | `bun test`                      | Native runner; no agent reporter, human output stays |

## Development Workflow

The first step is to understand the command surface before writing code. For small fixes or work already in progress, the user may skip planning and go straight to implementation.

### 1. Plan

State the command(s) being added or changed, the exact `run(args)` contract, the `Result` error messages, and which module owns each behavior. For anything touching several commands, include the file tree you intend to create. The user approves the plan before implementation starts.

### 2. Implement

Load the skills relevant to the task first; see [Skills](#skills). Their rules are non-negotiable.

Split the work into small, meaningful tasks. For each one:

1. Implement it.
2. Run the checks inline:

   ```bash
   bun fmt
   bun lint:agent # Type-aware lint; warnings fail the command
   bun test src/commands/<name>.spec.ts # Scope to the affected area
   ```

3. **Loop until green.** Running the formatter and linter after each task stops errors from piling up. Adapt your style for the next task instead of repeating the same mistake.
4. Leave no dead code, unused imports, or commented-out code behind.

**3-strikes escalation:** if the same test still fails after 3 fix attempts, **stop**. Report the failure output, what you tried, and ask the user. Do not grind.

### 3. Test

Write tests for the behavior you changed, using the contract in [Testing](#testing). Run the full gate once at the end:

```bash
bun fmt && bun lint:agent && bun typecheck && bun test
```

If a command's interactive flow changed and the user asks for it, run the CLI itself (`bun run dev <command>`) to confirm the real terminal behavior.

## Rules

Rules every agent must follow at all times.

### Global

**Only well-maintained packages**: use well-tested, actively maintained packages with meaningful download counts. Ask the user before adding a dependency, and list the alternatives you considered.

**Error handling**: fail early, fail hard, and return clear, useful messages. Errors travel as `Result`, never as throws.

**Naming**: a name says _what_ it does, never _how_. No comments should be needed to understand what a function does.

- Functions: `formatCommands`, `loadCommand`, `runShellCommands`, not `handleStuff` or `doLoaderLogic`.
- Types: `ShellCommand`, `CommandRegistry`, not `Thing` or `Data`.
- Files mirror the command: `src/commands/new.ts` routes `new`, `src/commands/new/project.ts` runs `new project`.

**Implementation should be at the leaves (Open/Closed)**: identify what is likely to change, the _how_, and push it as far down the call graph as possible behind one seam. Everything above that seam survives the change untouched. If an implementation changes while behavior stays the same, the tests still pass.

**Agent file**: this is a living document. When the user corrects you or you spot a process failure, add one line to the [Failure Log](#failure-log). Do not edit the global `AGENTS.md`.

### TypeScript

`tsconfig.json` is tailored for this project; do not change it without approval.

Use the `@/` alias for every import that crosses a directory inside `src/`, including imports from `cli.ts`. Same-directory imports stay relative:

```ts
import { runCommand } from "@/utils/shell.ts"; // crosses directories
```

```ts
import { isCommand } from "./command-loader.ts"; // same directory
```

- `@/*` maps to `./src/*`.
- Always keep the `.ts` extension on local TypeScript imports; Bun resolves it natively.
- NEVER use `any`; it defeats the purpose of TypeScript.
- NEVER use `as` assertions, except `as const`.
- NEVER use the non-null assertion (`!`); use optional chaining or an explicit check.
- Use `neverthrow` for error handling instead of throwing. Export `Result<T, E>` from every fallible function.

For advanced types, load the `/typescript` skill.

### Argument parsing

Each command receives its arguments as `args: string[]`. `cli.ts` strips the executable and the command name before calling `run`. Parse that slice directly:

```ts
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  args,
  options: {
    force: { type: "boolean" },
    name: { type: "string" },
  },
  strict: true,
  allowPositionals: true,
});
```

For subcommands, dispatch on `args[0]` and pass `args.slice(1)` to the subcommand's `run()`.

Docs: <https://bun.com/docs/guides/process/argv#parse-command-line-arguments>

### Shell

Never import `$` from `bun` or call a raw shell API in a command. Go through `src/utils/shell.ts`:

- `runCommand(command)`: runs one `ShellCommand` and returns `CommandResult` (`Result<string, string>`).
- `runShellCommands(commands, options?)`: runs commands sequentially and returns a `Map` of name to `CommandResult`. Accepts `{ stopOnError?: boolean }`.

```ts
import { runCommand, runShellCommands } from "@/utils/shell.ts";

const result = await runCommand({ name: "list", command: ["ls", "-la"] });

const results = await runShellCommands(
  [
    { name: "install", command: ["bun", "install"] },
    { name: "build", command: ["bun", "run", "build"] },
  ],
  { stopOnError: true },
);
```

A `ShellCommand` requires `name` (display label and map key) and `command` (string array). It accepts an optional `isValid` callback for checks beyond the exit code.

### Logging

Never print raw command output. All terminal feedback goes through `src/utils/logger.ts`. Never import `spinner`, `intro`, `outro`, or `log` from `@clack/prompts` in a command; if the output you need does not exist yet, add a reusable helper to `logger.ts`.

Sections:

```ts
import { startSection, dangerSection, endSectionSuccess, endSectionError } from "@/utils/logger.ts";

startSection("Install dependencies"); // cyan: standard action
dangerSection("Delete branches"); // yellow: destructive action
endSectionSuccess("Done"); // green: success
endSectionError("Something went wrong"); // red: failure
```

Feedback wrappers:

| Helper                             | When to use                                   |
| ---------------------------------- | --------------------------------------------- |
| `withSpinner(msg, fn, successMsg)` | Slow, unpredictable operations (network, git) |
| `withLog(msg, fn, successMsg)`     | Default for a single async operation          |
| `withTask(commands)`               | Several shell commands as a named task list   |

Reserve spinners for operations that genuinely take time. A spinner that flashes and disappears is worse than a log line. For prompts, import `text`, `confirm`, `isCancel`, etc. from `@clack/prompts` directly.

- Clack best practices: <https://bomb.sh/docs/clack/guides/best-practices/>
- Clack examples: <https://bomb.sh/docs/clack/guides/examples/>

### Commands

Every file in `src/commands/` exports a single `run` function matching the `Command` type in `src/types/Command.type.ts`:

```ts
(args: string[]) => Promise<Result<void, string>>;
```

and is registered in `src/commands/registry.ts`:

```ts
import type { CommandRegistry } from "@/utils/command-loader.ts";

export const COMMAND_REGISTRY: CommandRegistry = {
  help: () => import("./help.ts"),
  version: () => import("./version.ts"),
};
```

- **Self-contained:** a command never imports another command. Shared logic belongs in `utils/`.
- **Subcommands:** the parent command (`new.ts`) owns its sub-registry and dispatches through `loadCommand(args[0], SUB_REGISTRY)`. The top-level router does not need to know about subcommands.
- **Registry over discovery:** `bun build --compile` needs every import to be statically visible. A central map of `() => import("./...")` satisfies that and behaves identically from source.
- The loader validates the module shape. A missing name yields "Unknown command"; a bad shape yields a shape error.

To add a command:

1. Create `src/commands/<name>.ts` exporting `run` and, optionally, `description`.
2. Add one line to `COMMAND_REGISTRY`.
3. Add `src/commands/<name>.spec.ts` if the command has behavior worth testing.
4. Run `bun run dev <name>`.

### Testing

Tests are a contract on observable behavior, not a mirror of the implementation.

- Drive the public surface: `run()`, `loadCommand()`, `listCommands()`, the logger helpers. Do not test private helpers directly.
- Assert outcomes: `Result` values and error messages, map contents, exit behavior, rendered text.
- One behavior per test. If the title needs "and", split it.
- Place the spec next to the file it covers (`<name>.spec.ts`). A file does not need a spec just because it exports something; add one when there is behavior to pin down.
- No default snapshots. Assert the values you care about so a failure explains itself.
- Parametrized cases use `test.each`. Bun has no `test.for`; do not copy Vitest-only syntax.
- Group tests with `describe(fn, ...)`; Bun infers the block title from `fn.name`.
- Inside a block, order tests: happy path, error cases, edge cases.
- Follow AAA (Arrange, Act, Assert) with visible comments.
- Mock external boundaries (`@clack/prompts`, shell execution) through reusable factories in `src/mocks/`. Tests must not depend on the network or on machine state.

```ts
import { describe, expect, test } from "bun:test";

import { runCommand } from "@/utils/shell.ts";

describe(runCommand, () => {
  test("returns Err when the command exits non-zero", async () => {
    // Arrange
    const command = { name: "fail", command: ["false"] };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isErr()).toBe(true);
  });
});
```

## Project structure

`utils/` is the reusable tier; `commands/` is the entry-point tier.

```text
cli.ts                      # Entry point: resolves the command, delegates to src/commands/
src/
  commands/                 # One file per command, mirrors the CLI surface
    registry.ts             # COMMAND_REGISTRY: lazy imports
    help.ts
    version.ts
  utils/                    # Reusable, command-agnostic logic
    shell.ts                # Bun $ wrapper returning Result<string, string>
    logger.ts               # Clack wrappers and section helpers
    command-loader.ts       # Registry resolution and shape validation
  types/                    # Shared types, one file per type
  mocks/                    # Reusable test factories
```

`utils/` files are imported by commands and by each other, never executed directly by the CLI. One file per feature, named after the behavior it owns.

## Skills

Load these before the matching task:

- `/typescript` for advanced types and TS best practices.
- `/vitest` for the testing contract and test design (the principles apply to `bun test`).
- `/codebase-design` for module boundaries and interfaces.
- `/git-advanced` for rebases, cherry-picks, and history repair.

## Failure Log

- `bun lint` exits 0 on warnings; the gate is `bun lint:agent`, which adds `--deny-warnings`.
- Bun 1.3.6 compiled binaries exit 137 on macOS; build and test with the pinned 1.4.4 toolchain from `.bun-version`.
