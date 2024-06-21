import "dotenv/config";

import { test } from "vitest";
import { createServer, runServer } from "./src/server";
import { Config } from "./src/config";

test("runs server", { timeout: 60_000 }, async () => {
  const config: Config = {
    selfBaseUrl: "http://127.0.0.1:0",
    selfAuthorization: "secret",
    airfocusBaseUrl: "https://api.airfocus.com",
    airfocusApiKey: "airfocus_ak_invalid",
  };
  const server = createServer(config, []);
  const serverInstance = await runServer(server);
  await serverInstance.close();
});
