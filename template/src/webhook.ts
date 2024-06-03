import deepEqual from "deep-equal";
import { Client } from "./client";
import { Config } from "./config";
import packageJson from "../package.json";

export type WebhookEvents = Record<string, any>[] | "all";

export async function createOrUpdateWebhookIntegration(
  config: Config,
  client: Client,
  handlerId: string,
  workspaceId: string,
  events: WebhookEvents,
): Promise<any> {
  const res = await client.get(`/api/workspaces/${workspaceId}`);
  const integrationIds = Object.keys(res.data._embedded.integrations || {});
  const integrationSettingsAllEvents = [
    { type: "itemCreated" },
    { type: "itemStatusUpdated" },
    ...Object.keys(res.data._embedded.fields)
      .map((fieldId) => res.data._embedded.fields[fieldId])
      .map((field: any) => ({
        type: "itemFieldUpdated",
        fieldId: field.id,
      })),
    { type: "itemRelationChanged" },
  ];
  const integrationSettings = {
    url: `${config.selfBaseUrl}/hooks/${handlerId}`,
    title: `${packageJson.name} (${handlerId})`,
    events: events === "all" ? integrationSettingsAllEvents : events,
    method: "POST",
    headers: [
      ["Authorization", `Bearer ${config.selfAuthorization}`],
      ["Content-Type", "application/json"],
    ],
    template: "{{event}}",
    inputFormat: "text",
  };
  const integrationId = integrationIds.find((integrationId) => {
    const integration = res.data._embedded.integrations[integrationId];
    return (
      integration.typeId === "webhook" &&
      integration.settings.title === integrationSettings.title
    );
  });
  if (!integrationId) {
    console.log(
      `Creating new webhook integration ${integrationSettings.title} for workspace ${workspaceId}`,
    );
    const res2 = await client.post(
      `/api/workspaces/${workspaceId}/install-integration`,
      {
        typeId: "webhook",
        settings: integrationSettings,
      },
    );
    return res2.data;
  }
  const integration = res.data._embedded.integrations[integrationId];
  if (!deepEqual(integration.settings, integrationSettings)) {
    console.log(
      `Reconfiguring existing webhook integration ${integrationSettings.title} for workspace ${workspaceId}`,
    );
    const res2 = await client.post(
      `/api/workspaces/${workspaceId}/reconfigure-integration`,
      {
        integrationId,
        settings: integrationSettings,
      },
    );
    return res2.data;
  }
  return integration;
}
