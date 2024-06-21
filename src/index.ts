import { createServer, runServer } from "./server";
import { signals } from "./utils";
import { createConfig } from "./config";
import { createClient } from "./client";
import { createHandlers } from "./handler";

async function run() {
  const config = createConfig();
  const client = createClient(config);
  const handlers = await createHandlers(config, client);

  const server = createServer(config, handlers);
  const serverInstance = await runServer(server, 8080, "0.0.0.0");
  await signals(["SIGTERM", "SIGINT"]);
  await serverInstance.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
