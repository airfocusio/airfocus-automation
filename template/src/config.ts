export interface Config {
  selfBaseUrl: string;
  selfAuthorization: string;
  airfocusBaseUrl: string;
  airfocusApiKey: string;
}

export function createConfig(override?: Partial<Config>): Config {
  return {
    selfBaseUrl: override?.selfBaseUrl || readString("SELF_BASE_URL"),
    selfAuthorization:
      override?.selfAuthorization || readString("SELF_AUTHORIZATION"),
    airfocusBaseUrl:
      override?.airfocusBaseUrl ||
      readString("AIRFOCUS_BASE_URL", "https://app.airfocus.com"),
    airfocusApiKey: override?.airfocusApiKey || readString("AIRFOCUS_API_KEY"),
  };
}

export function readString(envName: string, fallback?: string): string {
  const valueFromEnv = process.env[envName];
  if (valueFromEnv) {
    return valueFromEnv;
  } else if (typeof fallback === "string") {
    return fallback;
  } else {
    throw new Error(`Environment variable ${envName} is missing`);
  }
}
