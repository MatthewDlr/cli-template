# Project Guidelines

## Introduction

This project is a CLI tool that makes developers' lives easier. It is also the template every new CLI starts from, so uniformity and readability matter more than cleverness.

## Tech Stack

| Layer      | Choice                          | Notes                                                |
| ---------- | ------------------------------- | ---------------------------------------------------- |
| Runtime    | Bun 1.4                         | Package manager, test runner, bundler, shell         |
| Language   | TypeScript 7 via `tsrs`         | Native-speed type checking (`bun typecheck`)         |
| Routing    | `@bomb.sh/router`               | Typed intents, validation, help and version          |
| Errors     | `neverthrow`                    | `Result<T, E>` everywhere; no `throw`                |
| Prompts    | `@clack/prompts`                | Interactive input, spinners, notes                   |
| Validation | `zod`                           | Runtime schema validation                            |
| Linter     | Oxlint 1.93 + `oxlint-tsgolint` | Type-aware rules, agent reporter                     |
| Formatter  | Oxfmt 0.78                      | 100 columns, sorted imports, sorted scripts          |
| Tests      | `bun test`                      | Native runner; no agent reporter, human output stays |

## Development Workflow

The first step is to understand the command surface before writing code. For small fixes or work already in progress, the user may skip planning and go straight to implementation.

### 1. Plan

State the route(s) being added or changed, the validated model each handler receives, the `Result` error messages, and which module owns each behavior. For anything touching several routes, include the route tree you intend to create. The user approves the plan before implementation starts.

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

- Functions: `formatGreeting`, `runShellCommands`, `printErrors`, not `handleStuff` or `doLoaderLogic`.
- Types: `GreetModel`, `ShellCommand`, not `Thing` or `Data`.
- Files mirror the route: `src/commands/new.ts` handles `/new`, `src/commands/new/project.ts` handles `/new/project`.

**Implementation should be at the leaves (Open/Closed)**: identify what is likely to change, the _how_, and push it as far down the call graph as possible behind one seam. Everything above that seam survives the change untouched. If an implementation changes while behavior stays the same, the tests still pass.

**Agent file**: this is a living document. When the user corrects you or you spot a process failure, add one line to the [Failure Log](#failure-log). Do not edit the global `AGENTS.md`.

### TypeScript

`tsconfig.json` is tailored for this project; do not change it without approval.

Use the `@/` alias for every import that crosses a directory inside `src/`, including imports from `cli.ts`. Same-directory imports stay relative:

```ts
import { runCommand } from "@/utils/shell.ts"; // crosses directories
```

```ts
import { app } from "./router.ts"; // same directory
```

- `@/*` maps to `./src/*`.
- Always keep the `.ts` extension on local TypeScript imports; Bun resolves it natively.
- NEVER use `any`; it defeats the purpose of TypeScript.
- NEVER use `as` assertions, except `as const`.
- NEVER use the non-null assertion (`!`); use optional chaining or an explicit check.
- Use `neverthrow` for error handling instead of throwing. Export `Result<T, E>` from every fallible function.

For advanced types, load the `/typescript` skill.

### Routing

Routes live in `src/router.ts`. Define the tree once with `command()`, `route()`, `name()`, `description()`, `version()`, and the parameter builders `option()`, `toggle()`, and `argument()`. Validate values with Zod through `schema()`:

```ts
import { command, description, name, option, schema, toggle, version } from "@bomb.sh/router";
import * as z from "zod";

import { version as packageVersion } from "../package.json";

export const app = command(
  name("template-cli"),
  description("A CLI tool to supercharge developer experience"),
  version(packageVersion),
  command(
    name("greet"),
    description("Print a greeting"),
    option(name("name"), schema(z.string().default("world"))),
    toggle(name("shout")),
  ),
);
```

`parse()` returns a typed intent. `cli.ts` is the only place that reads `Bun.argv` and the only place that prints router output:

```ts
const result = parse(app, { argv: Bun.argv.slice(2) });

if (!result.ok) {
  cancel(printErrors(result));
  process.exit(1);
}

if (result.method === "help") return writeText(printHelp(result));
if (result.method === "version") return writeText(printVersion(result));

// Dispatch on result.route and call the matching handler. See cli.ts.
```

Handlers never inspect `argv` and never parse flags. Route IDs exclude the root name, and options belong to the route that declares them. Use `argument()` for positionals, `multiple()` for repeated values, and `env()` when an option should read a specific environment variable. Do not import `parseArgs` from `node:util`.

Docs: <https://bomb.sh/docs/router/>

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

Never print raw command output. All terminal feedback goes through `src/utils/logger.ts`. Never import `spinner`, `intro`, `outro`, or `log` from `@clack/prompts` in a command; if the output you need does not exist yet, add a reusable helper to `logger.ts`. Use `writeText()` for generated plain output such as help and version, and `logNote()` for information boxes.

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

Each executable route has a handler in `src/commands/<name>.ts`:

```ts
export async function run(model: GreetModel): Promise<Result<void, string>>;
```

- **Typed model:** the parameter is the validated model for that route. Do not accept `args: string[]`.
- **Self-contained:** a command never imports another command. Shared logic belongs in `utils/`.
- **Subcommands:** add child routes under the parent in `src/router.ts` and add their cases to the dispatch in `cli.ts`. Nested routes are still addressed by their full route ID (`/repo/clone`).
- **No registry:** the route tree is the single source of truth. `cli.ts` imports every handler statically, so `bun build --compile` keeps them.

To add a command:

1. Declare the route in `src/router.ts` with its options, toggles, or arguments.
2. Create `src/commands/<name>.ts` exporting `run(model)`.
3. Add the handler import and a `case "/<name>"` in `cli.ts`.
4. Add `src/commands/<name>.spec.ts` for the behavior worth pinning down.
5. Run `bun run dev <name>`.

### Testing

Tests are a contract on observable behavior, not a mirror of the implementation.

- Drive the public surface: `parse(app, { argv })` for intents and models, handler functions and their pure helpers, the logger helpers. Do not test private helpers directly.
- Assert outcomes: `Result` values and error messages, map contents, exit behavior, rendered text.
- One behavior per test. If the title needs "and", split it.
- Place the spec next to the file it covers (`<name>.spec.ts`). A file does not need a spec just because it exports something; add one when there is behavior to pin down.
- No default snapshots. Assert the values you care about so a failure explains itself.
- Parametrized cases use `test.each`. Bun has no `test.for`; do not copy Vitest-only syntax.
- Group tests with `describe(fn, ...)`; Bun infers the block title from `fn.name`.
- Inside a block, order tests: happy path, error cases, edge cases.
- Follow AAA (Arrange, Act, Assert) with visible comments.
- Mock external boundaries (`@clack/prompts`, shell execution) through reusable factories in `src/mocks/` when several specs share them. Tests must not depend on the network or on machine state.

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

`router.ts` declares the surface, `commands/` holds handlers, and `utils/` is the reusable tier.

```text
cli.ts                      # Entry point: parses argv, dispatches on method and route
src/
  router.ts                 # Route tree: commands, options, toggles, version
  commands/                 # One handler per executable route
    greet.ts                # Handler for /greet
  utils/                    # Reusable, command-agnostic logic
    shell.ts                # Bun $ wrapper returning Result<string, string>
    logger.ts               # Clack wrappers and section helpers
  types/                    # Shared types, one file per type
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
