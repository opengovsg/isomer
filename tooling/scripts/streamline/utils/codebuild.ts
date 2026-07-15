import {
  CodeBuildClient,
  StartBuildCommand,
} from "@aws-sdk/client-codebuild";
import { fromSSO } from "@aws-sdk/credential-providers";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

export const triggerCodeBuildBuilds = async (siteNames: string[]) => {
  const client = new CodeBuildClient({
    profile: process.env.AWS_NEXT_PROFILE,
    region: "ap-southeast-1",
    credentials: fromSSO({
      profile: process.env.AWS_NEXT_PROFILE,
    }),
  });

  for (let i = 0; i < siteNames.length; i++) {
    const siteName = siteNames[i]!;
    try {
      const response = await client.send(
        new StartBuildCommand({ projectName: siteName })
      );
      console.log(
        `Triggered CodeBuild build for ${siteName}: build ID ${response.build?.id}`
      );
    } catch (error) {
      console.error(
        `Error: Failed to trigger CodeBuild build for ${siteName}:`,
        error
      );
    }

    if (i < siteNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
