// practitestReporter.ts
import type {
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

import {
  getOrCreateTestByName,
  getOrCreateInstance,
  createRunForInstance,
} from "./practitestClient";

function mapStatus(status: TestResult["status"]): "PASSED" | "FAILED" | "NO RUN" {
  if (status === "passed") return "PASSED";
  if (status === "failed") return "FAILED";
  // covers "skipped", "timedOut", "interrupted"
  return "NO RUN";
}

export default class PractiTestReporter implements Reporter {
  async onTestEnd(test: TestCase, result: TestResult) {
    const title = test.title;
    const ptStatus = mapStatus(result.status);

    const attachments = result.attachments || [];

    const filesToAttach = attachments
    .filter(a => a.path)
    .map(a => ({
        name: a.name,
        path: a.path!,
        contentType: a.contentType,
    }));


    const parts: string[] = [
      `Playwright test: ${title}`,
      `Status: ${result.status}`,
      `Duration: ${result.duration} ms`,
    ];

    if (result.error?.message) parts.push(`Error: ${result.error.message}`);
    if (result.error?.stack) parts.push(`Stack:\n${result.error.stack}`);

    const comment = parts.join("\n");

    try {
      const testId = await getOrCreateTestByName(title);
      const instanceId = await getOrCreateInstance(testId);

      //console.log("PW duration ms:", result.duration, "type:", typeof result.duration);

      const attachmentPaths =
        result.attachments
            ?.filter((a) => a.path)
            .map((a) => a.path!) ?? [];

    const runId = await createRunForInstance(instanceId, ptStatus, result.duration, comment,attachmentPaths);

    } catch (e) {
      // Do not fail the whole Playwright run because reporting failed
      console.error("Failed to report result to PractiTest:", e);
    }
  }
}
