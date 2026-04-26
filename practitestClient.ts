type PractiTestConfig = {
  baseUrl: string;
  email: string;
  token: string;
  projectId: string;
  setId: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getConfig(): PractiTestConfig {
  return {
    baseUrl: getRequiredEnv("PT_BASE_URL").replace(/\/$/, ""),
    email: getRequiredEnv("PT_EMAIL"),
    token: getRequiredEnv("PT_TOKEN"),
    projectId: getRequiredEnv("PT_PROJECT_ID"),
    setId: getRequiredEnv("PT_SET_ID"),
  };
}

function authHeader(email: string, token: string) {
  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  return { Authorization: `Basic ${auth}` };
}

export async function autoCreateRun(payload: unknown, retries = 3) {
  const cfg = getConfig();
  const retryDelays = [15000, 30000];
  const url = `${cfg.baseUrl}/api/v2/projects/${cfg.projectId}/runs/auto_create.json`;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(cfg.email, cfg.token),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return response.json();
    }

    const body = await response.text();
    if (response.status === 429 && attempt < retries) {
      const delay = retryDelays[attempt - 1] ?? retryDelays[retryDelays.length - 1];
      console.warn(
        `PractiTest rate limited (429). Retrying in ${delay / 1000}s... (attempt ${attempt}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    throw new Error(`PractiTest auto_create failed ${response.status}: ${body}`);
  }
}
