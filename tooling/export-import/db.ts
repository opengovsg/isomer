import { fromSSO } from "@aws-sdk/credential-providers";
import { Signer } from "@aws-sdk/rds-signer";
import { Client } from "pg";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
};

export type DbClientConfig = {
  user: string;
  host: string;
  port: number;
  database: string;
  password: string;
  ssl?: {
    rejectUnauthorized: false;
    servername: string;
  };
};

// RDS IAM tokens expire after 15 minutes and are checked only at connect time.
export const getDbClientConfig = async (
  env: string
): Promise<DbClientConfig> => {
  if (env === "LOCAL") {
    return {
      user: requireEnv("LOCAL_DB_USERNAME"),
      host: requireEnv("LOCAL_DB_HOST"),
      port: Number(requireEnv("LOCAL_DB_PORT")),
      database: requireEnv("LOCAL_DB_NAME"),
      password: decodeURIComponent(process.env.LOCAL_DB_PASSWORD ?? ""),
    };
  }

  const hostname = requireEnv(`${env}_DB_HOST`);
  const username = requireEnv(`${env}_DB_USERNAME`);
  const database = requireEnv(`${env}_DB_NAME`);
  const profile = requireEnv(`${env}_AWS_PROFILE`);
  const port = Number(requireEnv(`${env}_DB_PORT`));
  const region = requireEnv(`${env}_DB_REGION`);
  const tunnelHost = requireEnv(`${env}_DB_TUNNEL_HOST`);
  const tunnelPort = Number(requireEnv(`${env}_DB_TUNNEL_PORT`));

  const signer = new Signer({
    hostname,
    port,
    username,
    region,
    credentials: fromSSO({ profile }),
  });

  return {
    user: username,
    host: tunnelHost,
    port: tunnelPort,
    database,
    password: await signer.getAuthToken(),
    ssl: {
      // IAM requires TLS. Node does not trust the Amazon RDS CA, and the
      // SSM tunnel presents that cert on localhost, so we encrypt without
      // verifying the issuer.
      rejectUnauthorized: false,
      servername: hostname,
    },
  };
};

export const createDbClient = async (env: string): Promise<Client> => {
  return new Client(await getDbClientConfig(env));
};
