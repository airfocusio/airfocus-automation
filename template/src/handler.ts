import { Client } from "./client";
import { Config, readString } from "./config";

import LoggingHandler from "./examples/LoggingHandler";
import InheritTeamFieldValuesHandler from "./examples/InheritTeamFieldValuesHandler";
import AutoCloseFeedbackHandler from "./examples/AutoCloseFeedbackHandler";

export type HandlerWebhookEvents = Record<string, any>[] | "all";

export type HandlerWebhooks = { [workspaceId: string]: HandlerWebhookEvents };

export interface Handler {
  id: string;
  handle: (event: any) => Promise<void>;
}

export async function createHandlers(
  config: Config,
  client: Client,
): Promise<Handler[]> {
  const handlers: Handler[] = [
    // await LoggingHandler.create("LoggingHandler", config, client, {
    //   workspaceId: readString("EXAMPLE_TEST_WORKSPACE_ID"),
    // }),
    await InheritTeamFieldValuesHandler.create(
      "InheritTeamFieldValuesHandler",
      config,
      client,
      {
        workspaceId: readString("EXAMPLE_PARENT_WORKSPACE_ID"),
      },
    ),
    await AutoCloseFeedbackHandler.create(
      "AutoCloseFeedbackHandler",
      config,
      client,
      {
        workspaceId: readString("EXAMPLE_INSIGHTS_WORKSPACE_ID"),
      },
    ),
  ];
  return handlers;
}
