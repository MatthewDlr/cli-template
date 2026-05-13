import { describe, expect, test } from "bun:test";
import { formatCommands, listCommands } from "./help.ts";

describe(listCommands, () => {
  test("returns command entries with names derived from registry paths", async () => {
    // Arrange
    const registry = {
      "./version.ts": async () => ({ run: async () => {}, description: "Print the current version" }),
      "./build.ts": async () => ({ run: async () => {} }),
    };

    // Act
    const result = await listCommands(registry);

    // Assert
    expect(result).toHaveLength(2);
    expect(result.find((c) => c.name === "version")?.description).toBe("Print the current version");
    expect(result.find((c) => c.name === "build")?.description).toBeUndefined();
  });

  test("excludes help from the list", async () => {
    // Arrange
    const registry = {
      "./version.ts": async () => ({ run: async () => {} }),
      "./help.ts": async () => ({ run: async () => {} }),
    };

    // Act
    const result = await listCommands(registry);

    // Assert
    expect(result.find((c) => c.name === "help")).toBeUndefined();
    expect(result).toHaveLength(1);
  });

  test("sorts commands alphabetically", async () => {
    // Arrange
    const registry = {
      "./zebra.ts": async () => ({ run: async () => {} }),
      "./apple.ts": async () => ({ run: async () => {} }),
      "./mango.ts": async () => ({ run: async () => {} }),
    };

    // Act
    const result = await listCommands(registry);

    // Assert
    expect(result.map((c) => c.name)).toEqual(["apple", "mango", "zebra"]);
  });

  test("returns an empty array when the registry is empty", async () => {
    // Arrange & Act
    const result = await listCommands({});

    // Assert
    expect(result).toHaveLength(0);
  });

  test("handles path-keyed entries from import.meta.glob", async () => {
    // Arrange — simulate the glob output format
    const registry = {
      "./src/commands/version.ts": async () => ({ run: async () => {}, description: "Print version" }),
    };

    // Act
    const result = await listCommands(registry);

    // Assert
    expect(result[0]?.name).toBe("version");
  });
});

describe(formatCommands, () => {
  test("aligns descriptions to the longest command name", () => {
    // Arrange
    const commands = [
      { name: "version", description: "Print version" },
      { name: "build", description: "Build the project" },
    ];

    // Act
    const result = formatCommands(commands);

    // Assert
    const lines = result.split("\n");
    expect(lines[0]).toBe("version  Print version");
    expect(lines[1]).toBe("build    Build the project");
  });

  test("omits the description column for commands without one", () => {
    // Arrange
    const commands = [{ name: "version" }, { name: "build", description: "Build" }];

    // Act
    const result = formatCommands(commands);

    // Assert
    const lines = result.split("\n");
    expect(lines[0]).toBe("version");
    expect(lines[1]).toBe("build    Build");
  });

  test("returns a fallback message when the list is empty", () => {
    // Arrange & Act
    const result = formatCommands([]);

    // Assert
    expect(result).toBe("(no commands found)");
  });
});
