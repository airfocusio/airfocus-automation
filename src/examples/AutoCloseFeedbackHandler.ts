import { Handler } from "../handler";
import { Client } from "../client";
import { Config } from "../config";
import { createOrUpdateWebhookIntegration } from "../webhook";
import { promiseSequential } from "../utils";

const insightsFieldTypeId = "insights";
const closedStatusCategory = "closed";

export interface AutoCloseFeedbackHandlerOpts {
  workspaceId: string;
}

export default class AutoCloseFeedbackHandler implements Handler {
  private constructor(
    public id: string,
    private client: Client,
    private fieldIds: string[],
    private opts: AutoCloseFeedbackHandlerOpts,
  ) {}

  static async create(
    id: string,
    config: Config,
    client: Client,
    opts: AutoCloseFeedbackHandlerOpts,
  ): Promise<AutoCloseFeedbackHandler> {
    const res = await client.get(`/api/workspaces/${opts.workspaceId}`);
    const insightFieldIds = Object.keys(res.data._embedded.fields)
      .map((fieldId) => res.data._embedded.fields[fieldId])
      .filter((field: any) => insightsFieldTypeId === field.typeId)
      .map((field: any) => field.id);
    const events = [{ type: "itemStatusUpdated" }];

    await createOrUpdateWebhookIntegration(
      config,
      client,
      id,
      opts.workspaceId,
      events,
    );

    return new AutoCloseFeedbackHandler(id, client, insightFieldIds, opts);
  }

  handle = async (event: any) => {
    switch (event.event.data.type) {
      case "createdItem":
      case "updatedItem": {
        const itemId = event.event.data.itemId;
        const item = event.embed.items[itemId];
        const workspaceId = item?.workspaceId;
        if (workspaceId === this.opts.workspaceId) {
          const prevStatusId = event.event.data.status?.prev;
          const nextStatusId = event.event.data.status?.next;
          const prevStatusCatgegory =
            event.embed.statuses[prevStatusId]?.category;
          const nextStatusCatgegory =
            event.embed.statuses[nextStatusId]?.category;
          if (
            prevStatusCatgegory !== nextStatusCatgegory &&
            nextStatusCatgegory === closedStatusCategory
          ) {
            return this.handleItem(itemId);
          }
        }
        return;
      }
      default:
        return;
    }
  };

  handleItem = async (itemId: string) => {
    const res = await this.client.get(
      `/api/workspaces/${this.opts.workspaceId}/items/${itemId}`,
    );
    await promiseSequential(
      this.fieldIds.map((fieldId) => async () => {
        const insights = res.data.fields[fieldId]?.insights || [];
        await promiseSequential(
          insights.map((insight: any) => async () => {
            const res2 = await this.client.get(
              `/api/workspaces/${insight.workspaceId}`,
            );
            const res3 = await this.client.get(
              `/api/workspaces/${insight.workspaceId}/items/${insight.itemId}`,
            );
            if (
              res2.data._embedded.statuses[res3.data.statusId].category !==
              closedStatusCategory
            ) {
              const closedStatuses = Object.keys(res2.data._embedded.statuses)
                .map((statusId) => res2.data._embedded.statuses[statusId])
                .filter((status) => status.category === closedStatusCategory)
                .sort((a, b) => a.order - b.order);
              if (closedStatuses.length > 0) {
                const firstClosedStatus = closedStatuses[0];
                console.log(
                  `Updating item ${insight.workspaceId}/${insight.itemId} with closed status ${firstClosedStatus.id}`,
                );
                await this.client.patch(
                  `/api/workspaces/${insight.workspaceId}/items/${insight.itemId}`,
                  [
                    {
                      op: "add",
                      path: "/statusId",
                      value: firstClosedStatus.id,
                    },
                  ],
                  {
                    headers: {
                      "content-type": "application/json-patch+json",
                    },
                  },
                );
              }
            }
          }),
        );
      }),
    );
  };
}
