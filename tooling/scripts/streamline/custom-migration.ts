import type { MigrationRequest } from "./apps/classic-migration/types";
import { migrateSite } from "./apps/classic-migration";

// Configure the migration requests here, and make sure to follow the format
// of the MigrationRequest object type
const config: MigrationRequest[] = [
  {
    repoName: "imda-tradetrust",
    isomerDomain: "www.tradetrust.io",
    // folders: [], // Leave undefined to migrate all folders
    isResourceRoomIncluded: true,
    isOrphansIncluded: true,
  },
];

const main = async () => {
  for (const request of config) {
    await migrateSite(request);
  }
};

main().catch((error) => console.error(error));
