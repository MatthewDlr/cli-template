import { describe, expect, test } from "bun:test";
import { mockCommandSuccess } from "../mocks/command.mock.ts";
import { isCommand, loadCommand, type CommandRegistry } from "./command-loader.ts";

describe(isCommand, () => {
  test("returns true for an object with a run function", () => {
    // Arrange
    const mod = { run: async () => {} };

    // Act
    const result = isCommand(mod);

    // Assert
    expect(result).toBe(true);
  });

  test("returns false for null", () => {
    // Arrange & Act
    const result = isCommand(null);

    // Assert
    expect(result).toBe(false);
  });

  test("returns false for a primitive", () => {
    // Arrange & Act
    const result = isCommand("not-a-command");

    // Assert
    expect(result).toBe(false);
  });

  test("returns false for an object missing run", () => {
    // Arrange
    const mod = { notRun: 42 };

    // Act
    const result = isCommand(mod);

    // Assert
    expect(result).toBe(false);
  });

  test("returns false when run is not a function", () => {
    // Arrange
    const mod = { run: "not-a-function" };

    // Act
    const result = isCommand(mod);

    // Assert
    expect(result).toBe(false);
  });
});

describe(loadCommand, () => {
  test("returns Ok with the command when the registry entry has a valid shape", async () => {
    // Arrange
    const registry: CommandRegistry = {
      version: async () => mockCommandSuccess(),
    };

    // Act
    const result = await loadCommand("version", registry);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(typeof result.value.run).toBe("function");
  });

  test("returns Err containing 'Unknown command' when the name is not in the registry", async () => {
    // Arrange
    const registry: CommandRegistry = {};

    // Act
    const result = await loadCommand("__nonexistent__", registry);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toContain("Unknown command");
  });

  test("returns Err containing 'does not export' when the module has a bad shape", async () => {
    // Arrange
    const registry: CommandRegistry = {
      badshape: async () => ({ notRun: 42 }),
    };

    // Act
    const result = await loadCommand("badshape", registry);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toContain("does not export");
  });

  test("returns Err containing the error message when the loader throws", async () => {
    // Arrange
    const registry: CommandRegistry = {
      syntaxerror: async () => {
        throw new SyntaxError("Unexpected token");
      },
    };

    // Act
    const result = await loadCommand("syntaxerror", registry);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toContain("Unexpected token");
  });
});
