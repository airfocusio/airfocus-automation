import { Client } from "../client";
import { Config } from "../config";
import { Handler } from "../handler";
import { createOrUpdateWebhookIntegration } from "../webhook";

export interface LoggingHandlerOpts {
  workspaceId: string;
}

/**
 * Simple logging handler.
 */
export default class LoggingHandler implements Handler {
  private constructor(public id: string) {}

  static async create(
    id: string,
    config: Config,
    client: Client,
    opts: LoggingHandlerOpts,
  ): Promise<LoggingHandler> {
    await createOrUpdateWebhookIntegration(
      config,
      client,
      id,
      opts.workspaceId,
      "all",
    );

    return new LoggingHandler(id);
  }

  handle = async (event: any) => {
    console.log(JSON.stringify(event, null, 2));
  };
}
