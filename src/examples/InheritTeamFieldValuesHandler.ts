import { Handler } from "../handler";
import { Client } from "../client";
import { Config } from "../config";
import { createOrUpdateWebhookIntegration } from "../webhook";
import { promiseSequential } from "../utils";
import deepEqual from "deep-equal";

const supportedFieldTypeIds = ["text", "number", "select"];

const emptyValues = [
  undefined,
  // empty text field
  { text: "" },
  // empty number field
  { number: undefined },
  // empty select field
  { selection: [] },
];

export interface InheritTeamFieldValuesHandlerOpts {
  workspaceId: string;
}

/**
 * Given a hierarchy parent workspace, this handler copies values in supported (text, number, select)
 * team fields down to the child items, if the child item does not have a value in that field yet.
 */
export default class InheritTeamFieldValuesHandler implements Handler {
  private constructor(
    public id: string,
    private client: Client,
    private fieldIds: string[],
    private opts: InheritTeamFieldValuesHandlerOpts,
  ) {}

  static async create(
    id: string,
    config: Config,
    client: Client,
    opts: InheritTeamFieldValuesHandlerOpts,
  ): Promise<InheritTeamFieldValuesHandler> {
    const res = await client.get(`/api/workspaces/${opts.workspaceId}`);
    const supportedTeamFieldIds = Object.keys(res.data._embedded.fields)
      .map((fieldId) => res.data._embedded.fields[fieldId])
      .filter((field: any) => supportedFieldTypeIds.includes(field.typeId))
      .filter((field: any) => field.isTeamField)
      .map((field: any) => field.id);
    const events = [
      { type: "itemCreated" },
      ...supportedTeamFieldIds.map((fieldId) => ({
        type: "itemFieldUpdated",
        fieldId,
      })),
      { type: "itemRelationChanged" },
    ];

    await createOrUpdateWebhookIntegration(
      config,
      client,
      id,
      opts.workspaceId,
      events,
    );

    return new InheritTeamFieldValuesHandler(
      id,
      client,
      supportedTeamFieldIds,
      opts,
    );
  }

  handle = async (event: any) => {
    switch (event.event.data.type) {
      case "createdItem":
      case "updatedItem": {
        const itemId = event.event.data.itemId;
        const item = event.embed.items[itemId];
        const workspaceId = item?.workspaceId;
        if (workspaceId === this.opts.workspaceId) {
          return this.handleItem(itemId);
        }
        return;
      }
      case "createdItemRelation":
      case "updatedItemRelation": {
        const itemRelationId = event.event.data.itemRelationId;
        const itemRelation = event.embed.itemRelations[itemRelationId];
        const itemId = itemRelation?.parentId;
        const item = event.embed.items[itemId];
        const workspaceId = item?.workspaceId;
        if (workspaceId === this.opts.workspaceId) {
          return this.handleItem(itemId);
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
      res.data._embedded.children.map((child: any) => async () => {
        const fieldsToUpdate = Object.keys(child.item.fields)
          .filter((fieldId) => this.fieldIds.includes(fieldId))
          .filter((fieldId) => {
            const childValue = child.item.fields[fieldId];
            return emptyValues.some((emptyValue) =>
              deepEqual(emptyValue, childValue),
            );
          })
          .filter((fieldId) => {
            const parentValue = res.data.fields[fieldId];
            const childValue = child.item.fields[fieldId];
            return !deepEqual(parentValue, childValue);
          })
          .map((fieldId) => [fieldId, res.data.fields[fieldId]] as const);

        if (fieldsToUpdate.length > 0) {
          console.log(
            `Updating item ${child.item.workspaceId}/${child.item.id} with values ${JSON.stringify(fieldsToUpdate)}`,
          );
          await this.client.patch(
            `/api/workspaces/${child.item.workspaceId}/items/${child.item.id}`,
            fieldsToUpdate.map((fieldToUpdate) => ({
              op: "add",
              path: `/fields/${fieldToUpdate[0]}`,
              value: fieldToUpdate[1],
            })),
            {
              headers: {
                "content-type": "application/json-patch+json",
              },
            },
          );
        }
      }),
    );
  };
}
