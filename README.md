<div align="center">

# template-cli

**Skip the setup. Keep the standards.**

A batteries-included Bun + TypeScript CLI template with functional error handling, interactive prompts, and zero-compromise tooling.

[![Bun](https://img.shields.io/badge/Bun-1.4-fbf0df?logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-7%20via%20tsrs-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Zod](https://img.shields.io/badge/Zod-4-3e67b1?logo=zod&logoColor=white)](https://zod.dev)
[![Oxlint](https://img.shields.io/badge/Oxlint-1.93-6d4aff)](https://oxc.rs/docs/guide/usage/linter.html)
[![Oxfmt](https://img.shields.io/badge/Oxfmt-0.78-6d4aff)](https://oxc.rs/docs/guide/usage/formatter.html)
[![Tests](https://img.shields.io/badge/tests-bun%20test-f472b6)](https://bun.sh/docs/cli/test)

</div>

> [!IMPORTANT]
> This is a template. Before starting development, rename every occurrence of `template-cli` to your own CLI name: `package.json` (`name`, `bin`, `build` script output) and this `README.md`.

## Quick start

Requires Bun 1.4.4; the pinned version lives in `.bun-version`.

```bash
bun install
bun run dev help
```

## Tech stack

| Tool                                                       | Purpose                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| [Bun](https://bun.sh)                                      | Runtime, package manager, test runner, bundler               |
| [tsrs](https://github.com/oxc-project/tsrs)                | TypeScript 7 type checking and language server, in Rust      |
| [neverthrow](https://github.com/supermacro/neverthrow)     | Functional error handling: no throws, only `Result<T, E>`    |
| [@clack/prompts](https://github.com/bombshell-dev/clack)   | Interactive terminal prompts and spinners                    |
| [picocolors](https://github.com/alexeyraspopov/picocolors) | Colored terminal output for intros and outros                |
| [zod](https://zod.dev)                                     | Runtime schema validation                                    |
| [oxlint](https://oxc.rs/docs/guide/usage/linter.html)      | Type-aware Rust linter with an agent reporter                |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)    | Rust formatter with sorted imports and sorted `package.json` |
| [bun test](https://bun.sh/docs/cli/test)                   | Native test runner, no extra dependency                      |

## Scripts

| Script                  | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `bun run dev`           | Run the CLI in watch mode                                   |
| `bun run build`         | Compile to a single self-contained binary                   |
| `bun run check`         | CI gate: `fmt:check` + `lint:ci` + `test`                   |
| `bun run fmt`           | Format all source files                                     |
| `bun run fmt:check`     | Check formatting without writing                            |
| `bun run lint`          | Lint all source files                                       |
| `bun run lint:agent`    | Lint with warnings as errors and the compact agent reporter |
| `bun run lint:ci`       | Lint errors only, quiet output                              |
| `bun run lint:fix`      | Apply safe fixes and suggestions                            |
| `bun run test`          | Run the test suite without coverage                         |
| `bun run test:coverage` | Run the test suite with coverage                            |
| `bun run test:watch`    | Run tests in watch mode                                     |
| `bun run typecheck`     | Type-check with `tsrs --noEmit --fast`                      |

## Project structure

```text
cli.ts                      # Entry point: resolves the command, delegates to src/commands/
src/
  commands/                 # One file per command, mirrors the CLI surface
    registry.ts             # COMMAND_REGISTRY: lazy imports
    help.ts                 # `template-cli help`
    version.ts              # `template-cli version`
  utils/                    # Reusable, command-agnostic logic
    shell.ts                # Bun $ wrapper returning Result<string, string>
    logger.ts               # Clack wrappers and section helpers
    command-loader.ts       # Registry resolution and shape validation
  types/                    # Shared types, one file per type
  mocks/                    # Reusable test factories
```

Cross-directory imports inside `src/` use the `@/` alias (`@/utils/shell.ts`). Same-directory imports stay relative (`./command-loader.ts`).

## Adding a command

**1.** Create `src/commands/<name>.ts` and export `run`:

```ts
import { ok, type Result } from "neverthrow";

export const description = "Short summary shown in `help` output";

/**
 * Runs the `<name>` command.
 *
 * @param args - Remaining argv after the executable and command name.
 * @returns Ok on success, Err with an error message on failure.
 */
export async function run(args: string[]): Promise<Result<void, string>> {
  // Use helpers from @/utils/logger.ts for terminal output.
  // Use runCommand() from @/utils/shell.ts for shell commands.
  // Use parseArgs({ args, strict: true, options: { ... } }) for flags.
  return ok(undefined);
}
```

**2.** Register it in `src/commands/registry.ts`:

```ts
export const COMMAND_REGISTRY: CommandRegistry = {
  help: () => import("./help.ts"),
  version: () => import("./version.ts"),
  <name>: () => import("./<name>.ts"),
};
```

**3.** Run `bun run dev <name>`; it works immediately.

> The registry is a single, explicit map of lazy imports. It keeps the same code working in dev and in the compiled binary, where the bundler must see every import statically.

## Key conventions

| Convention   | Rule                                                                      |
| ------------ | ------------------------------------------------------------------------- |
| Types        | No `any`; use `unknown` plus type guards                                  |
| Assertions   | No `as Type` casts; `as const` is the only exception                      |
| Non-null     | No `!`; use optional chaining or an explicit check                        |
| Errors       | No `throw`; return `Result<T, E>` via neverthrow everywhere               |
| Shell        | Always use `runCommand()` from `@/utils/shell.ts`; never print raw output |
| Logging      | Always use `@/utils/logger.ts`; never import Clack primitives directly    |
| Imports      | `@/` for cross-directory, `./` for siblings, always with `.ts`            |
| Tests        | Contract-first, next to the code; no blanket "one spec per export" rule   |
| Flag parsing | Each command runs `parseArgs({ args, strict: true })` on its own `args`   |

## Agentic development

Every check has a non-interactive entry point:

- **`AGENTS.md`** defines the loop: plan the command contract, implement in small steps while running the checks, then test observable behavior. It also documents the conventions the linter enforces.
- **`bun run lint:agent`** runs Oxlint with warnings as errors and the `agent` reporter, which returns compact diagnostics instead of the human format.
- **`bun run fmt:check`** verifies formatting without rewriting files.
- **`bun test <path>`** scopes the run to the affected file. Bun only ships `junit` and `dots` reporters, so there is no agent reporter for tests; the default output stays human-readable and small because `bun test` no longer collects coverage by default. Use `bun run test:coverage` when coverage is what you need.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request targeting `main` and every push to `main`:

1. `bun install --frozen-lockfile`
2. `bun run fmt:check`
3. `bun run lint:ci`
4. `bun run test`
5. `bun run build`

The Bun version comes from `.bun-version`. Make the `check` job required in Settings → Branches so a pull request cannot merge while it is red.

## Building and distributing

```bash
bun run build
```

Produces `template-cli`, a single self-contained binary (no Bun runtime required on the target machine). To rename the output, update the `build` script in `package.json` and the matching entries in `.gitignore`:

```json
"build": "bun build --compile --minify cli.ts --outfile your-cli-name"
```
