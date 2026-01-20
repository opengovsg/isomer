export interface MigrationRequest {
  // The GitHub repository name of the Isomer Classic site to migrate
  site: string;
  // The URL to the current live site (used for generating absolute URLs to
  // images, mainly for private repositories)
  domain?: string;
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
  // Whether to take the contents of the staging branch instead of master
  useStagingBranch?: boolean;
}

export type GetIsomerSchemaFromJekyllResponse =
  | {
      status: "not_converted";
      title: string;
      permalink: string;
    }
  | {
      status: "converted";
      content: any; // Isomer Schema object
      title: string;
      permalink: string;
      third_nav_title?: string;
    }
  | {
      status: "manual_review";
      content: any; // Isomer Schema object
      title: string;
      permalink: string;
      third_nav_title?: string;
      reviewItems: string[];
    };

export type ReportRow = Pick<
  GetIsomerSchemaFromJekyllResponse,
  "status" | "title" | "permalink"
> & {
  reviewItems?: string[];
};
