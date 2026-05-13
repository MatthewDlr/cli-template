import { describe, expect, test } from "bun:test";
import { ok, err } from "neverthrow";
import type { ShellCommand } from "../types/ShellCommand.type.ts";
import { runCommand, runShellCommands } from "./shell.ts";

describe(runCommand, () => {
  test("returns Ok with stdout on exit code 0", async () => {
    // Arrange
    const command: ShellCommand = { name: "echo", command: ["echo", "hello"] };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.trim()).toBe("hello");
    }
  });

  test("captures stdout without printing to terminal", async () => {
    // Arrange
    const command: ShellCommand = { name: "echo", command: ["echo", "silent-output"] };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toContain("silent-output");
    }
  });

  test("uses isValid return value when validation succeeds", async () => {
    // Arrange
    const command: ShellCommand = {
      name: "echo",
      command: ["echo", "hello"],
      isValid: () => ok("validated"),
    };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("validated");
    }
  });

  test("handles arguments with spaces correctly", async () => {
    // Arrange
    const command: ShellCommand = { name: "echo", command: ["echo", "hello world"] };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.trim()).toBe("hello world");
    }
  });

  test("returns Err with stderr on non-zero exit", async () => {
    // Arrange
    const command: ShellCommand = { name: "false", command: ["false"] };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isErr()).toBe(true);
  });

  test("returns Err when command does not exist", async () => {
    // Arrange
    const command: ShellCommand = { name: "nonexistent", command: ["this-command-definitely-does-not-exist-xyz123"] };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isErr()).toBe(true);
  });

  test("returns Err from isValid when validation fails", async () => {
    // Arrange
    const command: ShellCommand = {
      name: "echo",
      command: ["echo", "hello"],
      isValid: () => err("validation failed"),
    };

    // Act
    const result = await runCommand(command);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("validation failed");
    }
  });
});

describe(runShellCommands, () => {
  test("returns results for all commands", async () => {
    // Arrange
    const commands: ShellCommand[] = [
      { name: "echo1", command: ["echo", "hello"] },
      { name: "echo2", command: ["echo", "world"] },
    ];

    // Act
    const results = await runShellCommands(commands);

    // Assert
    expect(results.size).toBe(2);
    expect(results.get("echo1")?.isOk()).toBe(true);
    expect(results.get("echo2")?.isOk()).toBe(true);
  });

  test("continues after error when stopOnError is false", async () => {
    // Arrange
    const commands: ShellCommand[] = [
      { name: "fail", command: ["false"] },
      { name: "echo", command: ["echo", "hello"] },
    ];

    // Act
    const results = await runShellCommands(commands, { stopOnError: false });

    // Assert
    expect(results.size).toBe(2);
    expect(results.get("fail")?.isErr()).toBe(true);
    expect(results.get("echo")?.isOk()).toBe(true);
  });

  test("stops on first error when stopOnError is true", async () => {
    // Arrange
    const commands: ShellCommand[] = [
      { name: "fail", command: ["false"] },
      { name: "echo", command: ["echo", "should-not-run"] },
    ];

    // Act
    const results = await runShellCommands(commands, { stopOnError: true });

    // Assert
    expect(results.size).toBe(1);
    expect(results.has("fail")).toBe(true);
    expect(results.has("echo")).toBe(false);
  });
});
