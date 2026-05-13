# template-cli

A batteries-included Bun + TypeScript CLI template with functional error handling, interactive prompts, and zero-compromise tooling.

> [!IMPORTANT]
> This is a template. Before starting development, rename every occurrence of `template-cli` to your own CLI name — in `package.json` (`name`, `bin`, `build` script), `cli.ts` (`startSection`), and this `README.md`.

## Tech Stack

| Tool                                                       | Purpose                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| [Bun](https://bun.sh)                                      | Runtime, package manager, test runner, bundler              |
| [TypeScript 7](https://www.typescriptlang.org)             | Type safety (native-speed via `@typescript/native-preview`) |
| [neverthrow](https://github.com/supermacro/neverthrow)     | Functional error handling — no throws, only `Result<T, E>`  |
| [@clack/prompts](https://github.com/bombshell-dev/clack)   | Interactive terminal prompts and spinners                   |
| [picocolors](https://github.com/alexeyraspopov/picocolors) | Colored terminal output for intros/outros                   |
| [zod](https://zod.dev)                                     | Runtime schema validation                                   |
| [oxlint](https://oxc.rs/docs/guide/usage/linter.html)      | Fast Rust-based linter                                      |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)    | Fast Rust-based formatter                                   |

## Prerequisites

- [Bun](https://bun.sh) >= 1.3.0

## Quick Start

```bash
bun install
bun run dev
```

## Available Scripts

| Script              | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `bun run dev`       | Run CLI in watch mode (auto-restarts on file changes) |
| `bun run fmt`       | Format all source files                               |
| `bun run fmt:check` | Check formatting without writing                      |
| `bun run lint`      | Lint all source files                                 |
| `bun run lint:fix`  | Lint and auto-fix                                     |
| `bun run typecheck` | Type-check without emitting                           |
| `bun run test`      | Run tests with coverage                               |
| `bun run check`     | Run fmt:check + lint + typecheck + test (CI gate)     |
| `bun run build`     | Compile to a single self-contained binary             |

## Project Structure

```bash
cli.ts                      # Entry point — reads command name, delegates to src/commands/
src/
  commands/                 # One file per command (mirrors CLI command structure)
    version.ts              # `template-cli version`
  utils/                    # Reusable utilities, one file per feature
    shell.ts                # Bun $ wrapper returning Result<ShellSuccess, ShellError>
    shell.spec.ts           # Tests for shell.ts
  mocks/                    # Shared test factories, reusable across spec files
    shell.mock.ts           # mockShellSuccess / mockShellFailure factories
```

## How to Add a New Command

**1.** Create `src/commands/<name>.ts` and export `run`:

```ts
import { ok, type Result } from "neverthrow";

/**
 * Runs the `<name>` command.
 *
 * @returns Ok on success, Err with an error message on failure.
 */
export async function run(args: string[]): Promise<Result<void, string>> {
  // Use helpers from src/utils/logger.ts for all terminal output.
  // Use runCommand() from src/utils/shell.ts for shell/git commands.
  // Use parseArgs({ args, strict: true, options: { ... } }) to parse flags.
  // For subcommands, dispatch on args[0] and pass args.slice(1) to their run().
  return ok(undefined);
}
```

**2.** Run `hypr <name>` — it works immediately, no other file to touch.

**3.** Write tests in `src/commands/<name>.spec.ts` following the AAA pattern.

## Key Conventions

| Convention   | Rule                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| Types        | No `any` — use `unknown` and type guards                                          |
| Assertions   | No `as Type` casts — use type guards. `as const` is the only exception            |
| Errors       | No `throw` — return `Result<T, E>` via neverthrow everywhere                      |
| Shell output | Always use `runShell()` from `src/utils/shell.ts`; never print raw output         |
| Imports      | Always use the `node:` protocol for built-ins (`node:fs`, `node:path`)            |
| Exports      | All exported functions require JSDoc                                              |
| Tests        | Every exported function needs a `.spec.ts` file; use the AAA pattern              |
| Flag parsing | Each command uses `parseArgs({ args, strict: true })` on its own `args` parameter |

## Building and Distributing

```bash
bun run build
```

Produces a single self-contained binary (no Bun runtime required on the target machine). To rename the output binary, update the `build` script in `package.json`:

```json
"build": "bun build --compile --minify --bytecode your-cli-name"
```
