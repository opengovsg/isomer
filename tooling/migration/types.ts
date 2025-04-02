export interface MigrationRequest {
  // The GitHub repository name of the Isomer Classic site to migrate
  site: string;
  // The site ID inside Isomer Studio to migrate into. If undefined, a folder
  // will be created with the repository name
  id?: number;
  // The list of folders to migrate (folders starting with underscores). If
  // undefined, all folders will be migrated
  folders?: string[];
  // Whether to include the resource room in the migration
  isResourceRoomIncluded?: boolean;
  // Whether to include orphan pages in the migration
  isOrphansIncluded?: boolean;
}
