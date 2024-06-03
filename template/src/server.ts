import bodyParser from "body-parser";
import express from "express";
import net from "net";
import packageJson from "../package.json";
import { Handler } from "./handler";
import { Config } from "./config";

export function createServer(
  config: Config,
  handlers: Handler[],
): express.Express {
  const app = express();

  app.get("/", (req, res) => {
    return res.json({
      name: packageJson.name,
      version: packageJson.version,
      selfUrl: config.selfBaseUrl,
    });
  });

  handlers.forEach((handler) => {
    app.post(
      `/hooks/${handler.id}`,
      bodyParser.json({ limit: "1mb" }),
      async (req, res, next) => {
        if (!req.headers.authorization) {
          return res.status(401).json({ error: "Missing authorization" });
        }
        if (
          req.headers.authorization !== `Bearer ${config.selfAuthorization}`
        ) {
          return res.status(403).json({ error: "Invalid authorization" });
        }
        try {
          console.log(`Received webhook ${handler.id}`);
          const event = req.body;
          await handler.handle(event);
          return res.json({});
        } catch (err) {
          next(err);
        }
      },
    );
  });

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      return res.status(404).json({
        error: "Not found",
      });
    },
  );

  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error(err);
      return res.status(500).json({
        error: "Internal server error",
      });
    },
  );

  return app;
}

export async function runServer(
  server: express.Express,
  port: number = 0,
  hostname: string = "127.0.0.1",
): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const serverInstance = server
      .listen(port, hostname)
      .on("listening", () => {
        const { port } = serverInstance.address() as net.AddressInfo;
        console.log(`Started listening on ${hostname}:${port}`);
        resolve({
          port,
          close: async () => {
            console.log(`Stopping listening on port ${hostname}:${port}`);
            await serverInstance.close();
          },
        });
      })
      .on("error", (error) => {
        console.error(`Listening on port ${hostname}:${port} failed`, {
          error,
        });
        reject(error);
      });
  });
}
