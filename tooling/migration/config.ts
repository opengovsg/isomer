// This file is to configure the migration script
// There should not be any need to edit other files in this directory

import { MigrationRequest } from "./types";

// Configure the migration requests here, and make sure to follow the format
// of the MigrationRequest object type
export const config: MigrationRequest[] = [
  {
    site: "govtech-corp",
    // id: 1,
    // folders: ["_about-us"],
    isResourceRoomIncluded: true,
    isOrphansIncluded: true,
  },
];
