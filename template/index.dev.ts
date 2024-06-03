import "dotenv/config";

import { createServer, runServer } from "./src/server";
import ngrok from "@ngrok/ngrok";
import { createConfig, readString } from "./src/config";
import { createHandlers } from "./src/handler";
import { createClient } from "./src/client";

async function run() {
  const ngrokListener = await ngrok.forward({
    addr: 3000,
    authtoken: readString("NGROK_AUTHTOKEN"),
  });
  const ngrokUrl = ngrokListener.url();
  if (!ngrokUrl) {
    throw new Error("Unable to retrieve ngrok URL");
  }
  console.log(`Exposing server on ${ngrokUrl}`);

  const config = createConfig({
    selfBaseUrl: ngrokUrl,
    selfAuthorization: "secret",
  });
  const client = createClient(config);
  const handlers = await createHandlers(config, client);
  const server = createServer(config, handlers);
  const serverInstance = await runServer(server, 3000, "127.0.0.1");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
