// practitestClient.ts

const BASE_URL = "https://api.practitest.com/api/v2"; // or EU base from docs
// https://www.practitest.com/api-v2/ :contentReference[oaicite:4]{index=4}

const PROJECT_ID = process.env.PRACTITEST_PROJECT_ID!;
const PLAYWRIGHT_SET_ID = process.env.PRACTITEST_PLAYWRIGHT_SET_ID!;
const PT_EMAIL = process.env.PRACTITEST_EMAIL!;
const PT_TOKEN = process.env.PRACTITEST_TOKEN!;


function authHeader() {
  const auth = Buffer.from(`${PT_EMAIL}:${PT_TOKEN}`).toString("base64");
  return { Authorization: `Basic ${auth}` };
}

async function ptGet(path: string, searchParams?: Record<string, string>) {
  const url = new URL(`${BASE_URL}/projects/${PROJECT_ID}${path}`);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
  });
  if (!res.ok) {
    throw new Error(`PractiTest GET ${url.toString()} failed ${res.status}`);
  }
  return res.json();
}

async function ptPost(path: string, body: unknown) {
  const url = `${BASE_URL}/projects/${PROJECT_ID}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PractiTest POST ${url} failed ${res.status}: ${text}`);
  }
  return res.json();
}

// 1. Ensure test exists
export async function getOrCreateTestByName(name: string): Promise<string> {
  const data = await ptGet("/tests.json", { "name_exact": name });
  const existing = (data.data ?? [])[0];
  if (existing) {
    return existing.id;
  }

  const created = await ptPost("/tests.json", {
    data: {
      type: "tests",
      attributes: {
        name,
        "test-type": "ApiTest", 
      },
    },
  });
  return created.data.id as string;
}

// 2. Ensure instance exists in Playwright test set
export async function getOrCreateInstance(
  testId: string
): Promise<string> {
  // Try to find instance by set and test
  const data = await ptGet("/instances.json", {
    "set-ids": PLAYWRIGHT_SET_ID,
    "test-ids": testId,
  });

  const existing = (data.data ?? [])[0];
  if (existing) {
    return existing.id;
  }

  // Create an instance inside the Playwright set
  const created = await ptPost("/instances.json", {
    data: {
      type: "instances",
      attributes: {
        "set-id": PLAYWRIGHT_SET_ID,
        "test-id": testId,
      },
    },
  });
  return created.data.id as string;
}

import * as fs from "fs";
import * as path from "path";

function toBase64(filePath: string) {
  return fs.readFileSync(filePath).toString("base64");
}

// 3. Create a run for that instance

export async function createRunForInstance(
  instanceId: string,
  status: "PASSED" | "FAILED" | "NO RUN",
  durationMs?: number,
  comment?: string,
  attachmentPaths?: string[] // local file paths
): Promise<string> {
  // PractiTest requires either "exit-code" or "steps". :contentReference[oaicite:1]{index=1}
  // exit-code: 0 = passed, otherwise failed.
    
  const exitCode = status === "PASSED" ? 0 : 1;

  const runDuration =
    typeof durationMs === "number" ? msToHHMMSS(durationMs) : undefined;

     console.log("PT run-duration sent:", runDuration);

   const files =
    attachmentPaths && attachmentPaths.length > 0
      ? {
          data: attachmentPaths.map((p) => ({
            filename: path.basename(p),
            content_encoded: toBase64(p),
          })),
        }
      : undefined;
     
 const res = await ptPost("/runs.json", {
    data: {
      type: "instances",
      attributes: {
        "instance-id": Number(instanceId),
        "exit-code": exitCode,
        ...(comment ? { "automated-execution-output": comment.slice(0, 255) } : {}),
        ...(runDuration ? { "run-duration": runDuration } : {}),
      },
      ...(files ? { files } : {}),
    },
  });
  return res.data.id as string;
}

function msToHHMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}


function guessContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".zip") return "application/zip";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".md") return "text/markdown";
  if (ext === ".txt") return "text/plain";
  return "application/octet-stream";
}


