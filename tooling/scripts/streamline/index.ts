import { select } from "@inquirer/prompts";
import type { StreamlineScriptType } from "./types";
import { generateDnsRecords } from "./apps/generate-dns";
import { verifyDnsRecords } from "./apps/verify-dns";
import { siteLaunchFirstWindow } from "./apps/launch-first";
import { siteLaunchSecondWindow } from "./apps/launch-second";
import { migrateClassicToNext } from "./apps/classic-migration";

const main = async () => {
  const script = await select<StreamlineScriptType>({
    message: "Select a Project Streamline script to run",
    choices: [
      {
        name: "Script 1: Migrate sites from Classic to Next",
        description: "Automates the migration of sites from Classic to Next.",
        value: "migrate-classic-to-next",
      },
      {
        name: "Script 2: Generate required DNS records",
        description:
          "Generates the necessary DNS records and changes required.",
        value: "generate-dns-records",
      },
      {
        name: "Script 3: Verify DNS records",
        description:
          "Verifies that the DNS records have been correctly set up.",
        value: "verify-dns-records",
      },
      {
        name: "Script 4: Site launch 1st window",
        description:
          "Prepare the Isomer Next infrastructure in the site launch batch",
        value: "site-launch-1st-window",
      },
      {
        name: "Script 5: Site launch 2nd window",
        description: "Perform the actual site relaunch",
        value: "site-launch-2nd-window",
      },
    ],
  });

  switch (script) {
    case "migrate-classic-to-next":
      await migrateClassicToNext();
      break;
    case "generate-dns-records":
      await generateDnsRecords();
      break;
    case "verify-dns-records":
      await verifyDnsRecords();
      break;
    case "site-launch-1st-window":
      await siteLaunchFirstWindow();
      break;
    case "site-launch-2nd-window":
      await siteLaunchSecondWindow();
      break;
    default:
      const _: never = script;
      console.error("No valid script selected.");
  }
};

main().catch((error) => console.error(error));
