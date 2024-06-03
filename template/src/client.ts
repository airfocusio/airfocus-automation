import axios, { AxiosInstance } from "axios";
import { Config } from "./config";

export type Client = AxiosInstance;

export function createClient(config: Config): Client {
  return axios.create({
    baseURL: config.airfocusBaseUrl,
    headers: {
      Authorization: `Bearer ${config.airfocusApiKey}`,
    },
  });
}
