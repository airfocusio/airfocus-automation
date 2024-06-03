import "dotenv/config";

import { test } from "vitest";
import { renderTemplate } from "./index";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { createServer, runServer } from "./template/src/server";
import { Config } from "./template/src/config";

test("renders template", async () => {
  await withTempDir()(async (tmp) => {
    const dir = path.join(tmp, "test");
    await renderTemplate({
      name: "test",
      directory: dir,
    });
  });
});

test("runs server", { timeout: 60_000 }, async () => {
  const config: Config = {
    selfBaseUrl: "http://127.0.0.1:0",
    selfAuthorization: "secret",
    airfocusBaseUrl: "https://app.airfocus.com",
    airfocusApiKey: "airfocus_ak_invalid",
  };
  const server = createServer(config, []);
  const serverInstance = await runServer(server);
  await serverInstance.close();
});

function withTempDir() {
  return async (fn: (tmp: string) => Promise<void>) => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "airfocus-automation-"),
    );
    try {
      await fn(dir);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  };
}
