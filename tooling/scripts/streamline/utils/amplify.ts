import {
  AmplifyClient,
  DeleteAppCommand,
  DeleteDomainAssociationCommand,
  ListAppsCommand,
  ListDomainAssociationsCommand,
} from "@aws-sdk/client-amplify";
import { fromSSO } from "@aws-sdk/credential-providers";

export const getAllAmplifyApps = async () => {
  const client = new AmplifyClient({
    profile: process.env.AWS_CLASSIC_PROFILE,
    region: "ap-southeast-1",
    credentials: fromSSO({
      profile: process.env.AWS_CLASSIC_PROFILE,
    }),
  });

  const apps = [];
  const results = [];

  try {
    let nextToken = "";

    while (true) {
      const command = new ListAppsCommand({
        nextToken: nextToken === "" ? undefined : nextToken,
      });
      const response = await client.send(command);

      if (response.apps) {
        apps.push(...response.apps);
      }

      if (response.nextToken === undefined) {
        break;
      }

      nextToken = response.nextToken || "";
    }
  } catch (error) {
    console.error("Error fetching Amplify apps:", error);
    throw error;
  }

  for (const app of apps) {
    try {
      const command = new ListDomainAssociationsCommand({ appId: app.appId });
      const response = await client.send(command);

      if (
        response.domainAssociations &&
        response.domainAssociations.length > 0
      ) {
        results.push({
          id: app.appId,
          domains: response.domainAssociations.map((da) => da.domainName),
        });
      } else {
        results.push({ id: app.appId, domains: [] });
      }
    } catch (error) {
      console.error(
        `Error fetching domain associations for app ${app.appId}:`,
        error
      );
      throw error;
    }
  }

  return results;
};

export const removeDomainAssociation = async (
  appId: string,
  domainName: string
) => {
  const client = new AmplifyClient({
    profile: process.env.AWS_CLASSIC_PROFILE,
    region: "ap-southeast-1",
    credentials: fromSSO({
      profile: process.env.AWS_CLASSIC_PROFILE,
    }),
  });

  try {
    const command = new DeleteDomainAssociationCommand({
      appId,
      domainName,
    });
    await client.send(command);
  } catch (error) {
    console.error(
      `Error deleting domain association ${domainName} for app ${appId}:`,
      error
    );
    throw error;
  }
};

export const deleteAmplifyApp = async (appId: string) => {
  const client = new AmplifyClient({
    profile: process.env.AWS_CLASSIC_PROFILE,
    region: "ap-southeast-1",
    credentials: fromSSO({
      profile: process.env.AWS_CLASSIC_PROFILE,
    }),
  });

  try {
    const command = new DeleteAppCommand({ appId });
    await client.send(command);
  } catch (error) {
    console.error(`Error deleting Amplify app ${appId}:`, error);
    throw error;
  }
};
