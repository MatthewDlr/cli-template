import { describe, expect, mock, test } from "bun:test";
import { ok, err } from "neverthrow";
import type { ShellCommand } from "../types/ShellCommand.type.ts";
import type { CommandResult } from "./shell.ts";

const mockStart = mock((_msg: string) => {});
const mockStop = mock((_msg: string) => {});
const mockSpinError = mock((_msg: string) => {});
const mockStep = mock((_msg: string) => {});
const mockSuccess = mock((_msg: string) => {});
const mockLogError = mock((_msg: string) => {});
const mockIntro = mock((_msg: string) => {});
const mockOutro = mock((_msg: string) => {});
const mockNote = mock((_msg: string, _title?: string) => {});

type MockTask = {
  title: string;
  task: (message: (s: string) => void) => Promise<string | undefined>;
};

const mockTasks = mock(async (taskList: MockTask[]) => {
  for (const t of taskList) {
    await t.task(() => {});
  }
});

void mock.module("@clack/prompts", () => ({
  spinner: () => ({ start: mockStart, stop: mockStop, error: mockSpinError }),
  log: { step: mockStep, success: mockSuccess, error: mockLogError },
  intro: mockIntro,
  outro: mockOutro,
  note: mockNote,
  tasks: mockTasks,
}));

void mock.module("picocolors", () => ({
  default: {
    bgCyanBright: (s: string) => `cyan:${s}`,
    bgYellowBright: (s: string) => `yellow:${s}`,
    bgGreenBright: (s: string) => `green:${s}`,
    bgRedBright: (s: string) => `red:${s}`,
    black: (s: string) => s,
  },
}));

let runCommandImpl: (command: ShellCommand) => Promise<CommandResult> = async () => ok("");
const mockRunCommand = mock(async (command: ShellCommand) => runCommandImpl(command));

void mock.module("./shell.ts", () => ({
  runCommand: mockRunCommand,
}));

const { withSpinner, withLog, withTask, startSection, dangerSection, endSectionSuccess, endSectionError, logNote } =
  await import("./logger.ts");

describe(withSpinner, () => {
  test("starts spinner with loadingMessage and stops with successMessage on Ok", async () => {
    // Arrange
    const fn = async () => ok("result");

    // Act
    await withSpinner("Loading...", fn, "All done");

    // Assert
    expect(mockStart.mock.calls.at(-1)).toEqual(["Loading..."]);
    expect(mockStop.mock.calls.at(-1)).toEqual(["All done"]);
  });

  test("returns the Ok result from fn", async () => {
    // Arrange
    const fn = async () => ok("value");

    // Act
    const result = await withSpinner("Loading...", fn, "Done");

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value).toBe("value");
  });

  test("calls spin.error and returns Err when fn fails", async () => {
    // Arrange
    const fn = async () => err("something went wrong");

    // Act
    const result = await withSpinner("Loading...", fn, "Done");

    // Assert
    expect(mockSpinError.mock.calls.at(-1)).toEqual(["something went wrong"]);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBe("something went wrong");
  });
});

describe(withLog, () => {
  test("logs step with loadingMessage and success with successMessage on Ok", async () => {
    // Arrange
    const fn = async () => ok("result");

    // Act
    await withLog("Processing...", fn, "Finished");

    // Assert
    expect(mockStep.mock.calls.at(-1)).toEqual(["Processing..."]);
    expect(mockSuccess.mock.calls.at(-1)).toEqual(["Finished"]);
  });

  test("returns the Ok result from fn", async () => {
    // Arrange
    const fn = async () => ok("value");

    // Act
    const result = await withLog("Processing...", fn, "Done");

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value).toBe("value");
  });

  test("logs error and returns Err when fn fails", async () => {
    // Arrange
    const fn = async () => err("something went wrong");

    // Act
    const result = await withLog("Processing...", fn, "Done");

    // Assert
    expect(mockLogError.mock.calls.at(-1)).toEqual(["something went wrong"]);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBe("something went wrong");
  });
});

describe(withTask, () => {
  test("runs all commands and returns complete results map when all succeed", async () => {
    // Arrange
    runCommandImpl = async (cmd) => ok(`output-${cmd.name}`);
    const commands: ShellCommand[] = [
      { name: "cmd1", command: ["echo", "1"] },
      { name: "cmd2", command: ["echo", "2"] },
    ];

    // Act
    const results = await withTask(commands);

    // Assert
    expect(results.size).toBe(2);
    expect(results.get("cmd1")?.isOk()).toBe(true);
    expect(results.get("cmd2")?.isOk()).toBe(true);
  });

  test("calls tasks() with one entry per command", async () => {
    // Arrange
    runCommandImpl = async () => ok("output");
    const commands: ShellCommand[] = [
      { name: "cmd1", command: ["echo", "1"] },
      { name: "cmd2", command: ["echo", "2"] },
    ];

    // Act
    await withTask(commands);

    // Assert
    const taskList = mockTasks.mock.calls.at(-1)?.[0];
    expect(Array.isArray(taskList)).toBe(true);
    if (Array.isArray(taskList)) expect(taskList.length).toBe(2);
  });

  test("stops after first failing command", async () => {
    // Arrange
    runCommandImpl = async (cmd) => (cmd.name === "fail" ? err("error") : ok("output"));
    const commands: ShellCommand[] = [
      { name: "fail", command: ["false"] },
      { name: "after", command: ["echo", "should not run"] },
    ];

    // Act
    const results = await withTask(commands);

    // Assert
    expect(results.has("fail")).toBe(true);
    expect(results.has("after")).toBe(false);
  });

  test("includes the failed command as Err in the results map", async () => {
    // Arrange
    runCommandImpl = async () => err("something went wrong");
    const commands: ShellCommand[] = [{ name: "fail", command: ["false"] }];

    // Act
    const results = await withTask(commands);

    // Assert
    const result = results.get("fail");
    expect(result?.isErr()).toBe(true);
    if (result?.isErr()) expect(result.error).toBe("something went wrong");
  });
});

describe(startSection, () => {
  test("calls intro with a string containing the label", () => {
    // Arrange & Act
    startSection("My Section");

    // Assert
    expect(String(mockIntro.mock.calls.at(-1)?.[0])).toContain("My Section");
  });
});

describe(dangerSection, () => {
  test("calls intro with a string containing the label", () => {
    // Arrange & Act
    dangerSection("Danger Zone");

    // Assert
    expect(String(mockIntro.mock.calls.at(-1)?.[0])).toContain("Danger Zone");
  });
});

describe(endSectionSuccess, () => {
  test("calls outro with a string containing the label", () => {
    // Arrange & Act
    endSectionSuccess("Completed");

    // Assert
    expect(String(mockOutro.mock.calls.at(-1)?.[0])).toContain("Completed");
  });
});

describe(endSectionError, () => {
  test("calls outro with a string containing the label", () => {
    // Arrange & Act
    endSectionError("Failed");

    // Assert
    expect(String(mockOutro.mock.calls.at(-1)?.[0])).toContain("Failed");
  });
});

describe(logNote, () => {
  test("calls note with the content and title", () => {
    // Arrange & Act
    logNote("some content", "My Title");

    // Assert
    expect(mockNote.mock.calls.at(-1)).toEqual(["some content", "My Title"]);
  });

  test("calls note with only content when title is omitted", () => {
    // Arrange & Act
    logNote("some content");

    // Assert
    expect(mockNote.mock.calls.at(-1)).toEqual(["some content", undefined]);
  });
});
