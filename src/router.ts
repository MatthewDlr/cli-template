import { command, description, name, option, schema, toggle, version } from "@bomb.sh/router";
import * as z from "zod";

import { version as packageVersion } from "../package.json";

/**
 * The CLI route tree. Every reachable help, version, and execute intent is
 * declared here, and `parse()` derives its result type from this definition.
 *
 * Add commands as children of the root. Route IDs exclude the root name, so
 * `command(name("greet"))` below is reachable as `/greet`.
 */
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
