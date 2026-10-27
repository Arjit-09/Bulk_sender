// Run as a separate, supervised process. No credentials are logged.
const base = process.env.APP_URL;
const secret = process.env.WORKER_SECRET;
if (!base || !secret)
  throw new Error("APP_URL and WORKER_SECRET are required.");
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
while (!stopping) {
  try {
    const response = await fetch(`${base}/api/worker`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(55000),
    });
    if (!response.ok) console.error(`Worker HTTP ${response.status}`);
  } catch {
    console.error("Worker unavailable; retrying next tick.");
  }
  if (!stopping) await new Promise((resolve) => setTimeout(resolve, 2000));
}
