import * as fs from "fs";
import * as path from "path";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { autoCreateRun, getConfig } from "./practitestClient";

type PractiTestAttachment = {
  filename: string;
  content_encoded: string;
};

function toRunDuration(ms = 0): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getTestName(test: TestCase): string {
  return test.titlePath().filter((part) => part && !part.endsWith(".spec.ts")).join(" ");
}

function getExitCode(status: TestResult["status"]): number {
  return status === "passed" ? 0 : 1;
}

function buildExecutionOutput(test: TestCase, result: TestResult): string {
  const testName = getTestName(test);

  if (result.status === "passed") {
    return `Playwright test passed: ${testName}`;
  }

  const parts = [
    `Playwright test failed: ${testName}`,
    `Status: ${result.status}`,
    `Duration: ${result.duration} ms`,
  ];

  if (result.error?.message) parts.push(`Error: ${result.error.message}`);
  if (result.error?.stack) parts.push(`Stack:\n${result.error.stack}`);

  return parts.join("\n\n");
}

function fileToAttachment(filePath: string): PractiTestAttachment | null {
  if (!fs.existsSync(filePath)) return null;

  return {
    filename: path.basename(filePath),
    content_encoded: fs.readFileSync(filePath).toString("base64"),
  };
}

export default class PractiTestReporter implements Reporter {
  async onTestEnd(test: TestCase, result: TestResult) {
    if (!["passed", "failed", "timedOut", "interrupted"].includes(result.status)) {
      return;
    }

    const cfg = getConfig();
    const testName = getTestName(test);
    const attachments =
      result.status !== "passed"
        ? result.attachments
            .filter((attachment) => attachment.path)
            .map((attachment) => fileToAttachment(attachment.path!))
            .filter((attachment): attachment is PractiTestAttachment => Boolean(attachment))
        : [];

    const payload = {
      data: {
        type: "instances",
        attributes: {
          "set-id": Number(cfg.setId),
          "exit-code": getExitCode(result.status),
          "run-duration": toRunDuration(result.duration),
          "automated-execution-output": buildExecutionOutput(test, result),
        },
        "test-attributes": {
          name: testName,
          "custom-fields": {
            "---f-278185": "Automated",
          },
        },
        ...(attachments.length > 0
          ? {
              files: {
                data: attachments,
              },
            }
          : {}),
      },
    };

    try {
      await autoCreateRun(payload);
      console.log(`PractiTest run created: ${testName}`);
    } catch (error) {
      console.error("PractiTest reporting failed:");
      console.error(error);
      throw error;
    }
  }
}
