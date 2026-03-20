import path from "path";
import { Client } from "pg";
import { confirm } from "@inquirer/prompts";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

export const createDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
};

export const withDbClient = async <T>(
  fn: (client: Client) => Promise<T>
): Promise<T> => {
  const hasConnected = await confirm({
    message: "Have you ran `npm run db:connect`?",
    default: true,
  });

  if (!hasConnected) {
    console.log("Please run `npm run db:connect` first, then try again.");
    process.exit(1);
  }

  const client = createDbClient();

  try {
    await client.connect();
    console.log("Connected to the database");
    return await fn(client);
  } catch (e) {
    console.error("An error occurred");
    throw e;
  } finally {
    await client.end();
  }
};
