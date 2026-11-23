import { describe, expect, test } from "bun:test";

import { formatGreeting } from "./greet.ts";

describe(formatGreeting, () => {
  test("returns a sentence greeting by default", () => {
    // Arrange & Act
    const result = formatGreeting({ name: "Ada", shout: false });

    // Assert
    expect(result).toBe("Hello, Ada!");
  });

  test("uppercases the greeting when shout is set", () => {
    // Arrange & Act
    const result = formatGreeting({ name: "Ada", shout: true });

    // Assert
    expect(result).toBe("HELLO, ADA!");
  });
});
