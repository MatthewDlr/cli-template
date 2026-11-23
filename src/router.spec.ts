import { parse } from "@bomb.sh/router";
import { describe, expect, test } from "bun:test";

import { app } from "./router.ts";

describe("route tree", () => {
  test("executes the root route when no arguments are given", () => {
    // Arrange & Act
    const result = parse(app, { argv: [] });

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.method).toBe("execute");
      expect(result.route).toBe("/");
    }
  });

  test("executes greet with the schema defaults", () => {
    // Arrange & Act
    const result = parse(app, { argv: ["greet"] });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.method).toBe("execute");
    if (result.method !== "execute") return;
    expect(result.route).toBe("/greet");
    if (result.route === "/greet") {
      expect(result.model).toEqual({ name: "world", shout: false });
    }
  });

  test("binds greet flags to the typed model", () => {
    // Arrange & Act
    const result = parse(app, { argv: ["greet", "--name", "Ada", "--shout"] });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.method).toBe("execute");
    if (result.method !== "execute") return;
    expect(result.route).toBe("/greet");
    if (result.route === "/greet") {
      expect(result.model).toEqual({ name: "Ada", shout: true });
    }
  });

  test("targets the root version method", () => {
    // Arrange & Act
    const result = parse(app, { argv: ["--version"] });

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.method).toBe("version");
      expect(result.route).toBe("/");
    }
  });

  test("targets the deepest route for help", () => {
    // Arrange & Act
    const result = parse(app, { argv: ["--help", "greet"] });

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.method).toBe("help");
      expect(result.route).toBe("/greet");
    }
  });

  test("rejects an unknown command as unprocessable content", () => {
    // Arrange & Act
    const result = parse(app, { argv: ["nope"] });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("unprocessable-content");
  });
});
