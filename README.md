<div align="center">

# Bun CLI Template

**Skip the setup. Keep the standards.**

Opinionated Bun + TypeScript CLI starter with typed routing, validated models, and zero-compromise tooling.

<!-- The CI badge 404s until the repository is public and the workflow has run once.
Restore it on the line below when that is true:
[![CI](https://github.com/MatthewDlr/cli-template/actions/workflows/ci.yml/badge.svg)](https://github.com/MatthewDlr/cli-template/actions/workflows/ci.yml)
-->

[![Bun](https://img.shields.io/badge/Bun-1.4-fbf0df?logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bombshell Router](https://img.shields.io/badge/Bombshell%20Router-0.8-6d4aff?logo=PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMCAxMjcuODRjMCA0Mi4zNyAzNC40NyA3Ni44NCA3Ni44NCA3Ni44NCA0Mi4zNyAwIDc2Ljg0LTM0LjQ3IDc2Ljg0LTc2Ljg0IDAtNDIuMzctMzQuNDctNzYuODQtNzYuODQtNzYuODRDMzQuNDcgNTEgMCA4NS40NyAwIDEyNy44NFptMjI2LTM1aC0yMi43N2wzLjI2IDI4LjYyLTI2LjItMTItNy4wNSAyMS42NSAyOC4zMiA1LjctMTkuNDQgMjEuMzMgMTguMyAxMy4yMSAxNC4yLTI0LjkgMTQuMiAyNC45IDE4LjMtMTMuMjEtMTkuNDQtMjEuMzQgMjguMzItNS43LTcuMDYtMjEuNjMtMjYuMiAxMiAzLjI3LTI4LjYzWiIvPjwvc3ZnPg%3D%3D)](https://bomb.sh/docs/router/)
[![Zod](https://img.shields.io/badge/Zod-4-3e67b1?logo=zod&logoColor=white)](https://zod.dev)

[![Oxlint](https://img.shields.io/badge/Oxlint-1.93-6d4aff?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/linter.html)
[![Oxfmt](https://img.shields.io/badge/Oxfmt-0.78-6d4aff?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/formatter.html)
[![Tests](https://img.shields.io/badge/tests-bun%20test-f472b6?logo=bun&logoColor=white)](https://bun.sh/docs/cli/test)

</div>

## Feature Highlights

- <img src="https://bun.sh/logo.svg" height="18" alt="" /> **Bun 1.4**: runtime, package manager, test runner and compiler in one binary.
- <img src="https://cdn.simpleicons.org/typescript/3178c6" height="18" alt="" /> **TypeScript 7**: ES2024 target, strict mode, `noUncheckedIndexedAccess` and native-speed checking through `tsrs`.
- <img src="https://bomb.sh/favicon.svg" height="18" alt="" /> **Clack prompts**: interactive input, spinners and task lists.
- <img src="https://bomb.sh/favicon.svg" height="18" alt="" /> **Bombshell Router 0.8**: typed intents, route-scoped options, generated help and version.
- <img src="https://cdn.simpleicons.org/zod/3e67b1" height="18" alt="" /> **Zod 4**: one Standard Schema contract shared by the router and every handler.
- <img src="https://oxc.rs/logo-without-border.svg" height="18" alt="" /> **Oxlint**: type-aware linting and AI anti-slop rules. 50x to 100x faster than ESLint.
- <img src="https://oxc.rs/logo-without-border.svg" height="18" alt="" /> **Oxfmt**: 100 columns, sorted imports and scripts. Around 30x faster than Prettier.
- 🙅 **Neverthrow**: functional error handling, `Result<T, E>` instead of throws.
- 🤖 **Agentic Development**: compact lint diagnostics, scoped tests and a documented loop.
- 🔒 **Security**: 3-day minimum release age enforced by `bunfig.toml`.

## Quick start

Requires Bun 1.4.4; the pinned version lives in `.bun-version`.

```bash
bun install
bun run dev --help
```

## Routing

Routes are declared once in `src/router.ts`. `@bomb.sh/router` turns `argv` into a typed intent and validates every option, toggle, and argument with Zod. `cli.ts` is the only place that reads `argv`; handlers receive a typed model.

```text
template-cli                     EXECUTE /
template-cli --help              HELP    /
template-cli --version           VERSION /
template-cli greet --name Ada    EXECUTE /greet
```

The root `version()` makes `--version` available. Every route supports `--help`; the deepest route on the command line wins. Parse failures are printed with `printErrors()` and exit non-zero before a handler runs.

## Project structure

```text
cli.ts                      # Entry point: parses argv, dispatches on method and route
src/
  router.ts                 # Route tree: commands, options, toggles, version
  commands/                 # One handler per executable route
    greet.ts                # Handler for `template-cli greet`
    greet.spec.ts
  utils/                    # Reusable, command-agnostic logic
    shell.ts                # Bun $ wrapper returning Result<string, string>
    logger.ts               # Clack wrappers and section helpers
  types/                    # Shared types, one file per type
```

Cross-directory imports inside `src/` use the `@/` alias (`@/utils/shell.ts`). Same-directory imports stay relative (`./router.ts`).

## Adding a command

**1.** Declare the route in `src/router.ts`:

```ts
command(
  name("deploy"),
  description("Deploy the current project"),
  option(name("environment"), schema(z.enum(["staging", "production"]).default("staging"))),
  toggle(name("dryRun")),
),
```

**2.** Create `src/commands/deploy.ts` with a typed handler. The model type is what the router validates, not what `argv` contains:

```ts
import { ok, type Result } from "neverthrow";

import { withLog } from "@/utils/logger.ts";

export type DeployModel = {
  environment: "staging" | "production";
  dryRun: boolean;
};

/**
 * Runs the `deploy` command.
 *
 * @param model - The validated model produced by the router.
 * @returns Ok on success, Err with a message on failure.
 */
export async function run(model: DeployModel): Promise<Result<void, string>> {
  return withLog(
    `Deploying to ${model.environment}${model.dryRun ? " (dry run)" : ""}...`,
    async () => ok(undefined),
    "Deployed",
  );
}
```

**3.** Dispatch the route in `cli.ts`:

```ts
import { run as deploy } from "@/commands/deploy.ts";

case "/deploy": {
  const outcome = await deploy(result.model);
  if (outcome.isErr()) {
    cancel(outcome.error);
    endSectionError("Failed");
    process.exit(1);
  }
  endSectionSuccess("Done");
  return;
}
```

`greet` is the complete reference implementation. Route IDs exclude the root name, so `name("deploy")` is reachable as `/deploy`.

## Key conventions

| Convention | Rule                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| Routing    | Declare routes in `src/router.ts`; handlers never read `argv`             |
| Models     | Validate with Zod through `schema()`; the model is the handler's contract |
| Types      | No `any`; use `unknown` plus type guards                                  |
| Assertions | No `as Type` casts; `as const` is the only exception                      |
| Non-null   | No `!`; use optional chaining or an explicit check                        |
| Errors     | No `throw`; return `Result<T, E>` via neverthrow everywhere               |
| Shell      | Always use `runCommand()` from `@/utils/shell.ts`; never print raw output |
| Logging    | Always use `@/utils/logger.ts`; never import Clack primitives directly    |
| Imports    | `@/` for cross-directory, `./` for siblings, always with `.ts`            |
| Tests      | Contract-first, next to the code; no blanket "one spec per export" rule   |

## Agentic development

Every check has a non-interactive entry point:

- **`AGENTS.md`** defines the loop: plan the route and model, implement in small steps while running the checks, then test observable behavior. It also documents the conventions the linter enforces.
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

## Renaming the template

> [!TIP]
> Update `package.json` (`name`, `bin`, `build` output), the root route in `src/router.ts`, the title at the top of this file, and the binary entries in `.gitignore`.

## Building and distributing

```bash
bun run build
```

Produces `template-cli`, a single self-contained binary (no Bun runtime required on the target machine). To rename the output, update the `build` script in `package.json` and the matching entries in `.gitignore`:

```json
"build": "bun build --compile --minify cli.ts --outfile your-cli-name"
```
