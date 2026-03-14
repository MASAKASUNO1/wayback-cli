#!/usr/bin/env bun
import { Command } from "commander";
import { parse as parseYaml } from "yaml";

const SPN2_BASE = "https://web.archive.org/save";

interface SaveResult {
  url: string;
  status: "ok" | "error";
  jobId?: string;
  archiveUrl?: string;
  error?: string;
}

async function loadUrls(filePath: string): Promise<string[]> {
  const file = Bun.file(filePath);
  const text = await file.text();

  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    const data = parseYaml(text);
    // Support both flat list and { urls: [...] } format
    if (Array.isArray(data)) return data;
    if (data?.urls && Array.isArray(data.urls)) return data.urls;
    throw new Error("YAML must be a list of URLs or have a 'urls' key");
  }

  if (filePath.endsWith(".csv")) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  }

  throw new Error("Unsupported file format. Use .yaml, .yml, or .csv");
}

async function submitUrl(
  url: string,
  accessKey: string,
  secretKey: string,
): Promise<SaveResult> {
  try {
    const res = await fetch(SPN2_BASE, {
      method: "POST",
      headers: {
        Authorization: `LOW ${accessKey}:${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({ url }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { url, status: "error", error: `HTTP ${res.status}: ${body}` };
    }

    const data = (await res.json()) as { job_id?: string; message?: string };
    if (data.job_id) {
      return { url, status: "ok", jobId: data.job_id };
    }
    return {
      url,
      status: "error",
      error: data.message || "Unknown response",
    };
  } catch (e) {
    return {
      url,
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function checkJobStatus(
  jobId: string,
  accessKey: string,
  secretKey: string,
): Promise<{ status: string; original_url?: string; timestamp?: string }> {
  const res = await fetch(`${SPN2_BASE}/status/${jobId}`, {
    headers: {
      Authorization: `LOW ${accessKey}:${secretKey}`,
    },
  });
  return res.json() as Promise<{
    status: string;
    original_url?: string;
    timestamp?: string;
  }>;
}

async function waitForJob(
  jobId: string,
  accessKey: string,
  secretKey: string,
  timeoutMs = 120_000,
): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await checkJobStatus(jobId, accessKey, secretKey);
    if (status.status === "success" && status.timestamp && status.original_url) {
      return `https://web.archive.org/web/${status.timestamp}/${status.original_url}`;
    }
    if (status.status === "error") {
      return null;
    }
    await Bun.sleep(3000);
  }
  return null;
}

const program = new Command();

program
  .name("wayback-cli")
  .description("Register URLs to the Wayback Machine via SPN2 API")
  .version("0.1.0")
  .argument("<file>", "Path to a YAML or CSV file containing URLs")
  .option("-c, --concurrency <n>", "Number of concurrent requests", "3")
  .option("--no-wait", "Submit without waiting for completion")
  .option("--dry-run", "Show URLs without submitting")
  .action(async (file, opts) => {
    const accessKey = process.env.WAYBACK_ACCESS_KEY;
    const secretKey = process.env.WAYBACK_SECRET_KEY;

    if (!opts.dryRun && (!accessKey || !secretKey)) {
      console.error(
        "Error: Set WAYBACK_ACCESS_KEY and WAYBACK_SECRET_KEY env vars.",
      );
      console.error("Get keys at: https://archive.org/account/s3.php");
      process.exit(1);
    }

    let urls: string[];
    try {
      urls = await loadUrls(file);
    } catch (e) {
      console.error(
        `Error loading file: ${e instanceof Error ? e.message : e}`,
      );
      process.exit(1);
    }

    console.log(`Loaded ${urls.length} URLs from ${file}`);

    if (opts.dryRun) {
      for (const url of urls) {
        console.log(`  [dry-run] ${url}`);
      }
      return;
    }

    const concurrency = parseInt(opts.concurrency, 10);
    const results: SaveResult[] = [];

    // Process in batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((url) => submitUrl(url, accessKey!, secretKey!)),
      );

      for (const result of batchResults) {
        if (result.status === "ok") {
          console.log(`  [submitted] ${result.url} (job: ${result.jobId})`);
        } else {
          console.error(`  [error] ${result.url}: ${result.error}`);
        }
        results.push(result);
      }

      // Rate limiting between batches — SPN2 limits active sessions
      if (i + concurrency < urls.length) {
        const hasError = batchResults.some((r) => r.status === "error");
        await Bun.sleep(hasError ? 60_000 : 5_000);
      }
    }

    // Wait for jobs if requested
    if (opts.wait) {
      const pending = results.filter(
        (r) => r.status === "ok" && r.jobId,
      );
      if (pending.length > 0) {
        console.log(`\nWaiting for ${pending.length} jobs to complete...`);
        for (const result of pending) {
          const archiveUrl = await waitForJob(
            result.jobId!,
            accessKey!,
            secretKey!,
          );
          if (archiveUrl) {
            result.archiveUrl = archiveUrl;
            console.log(`  [done] ${result.url} -> ${archiveUrl}`);
          } else {
            console.log(`  [timeout/error] ${result.url}`);
          }
        }
      }
    }

    // Summary
    const ok = results.filter((r) => r.status === "ok").length;
    const err = results.filter((r) => r.status === "error").length;
    console.log(`\nDone: ${ok} submitted, ${err} errors`);
  });

program.parse();
