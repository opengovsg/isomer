export interface MigrationRequest {
  // Name of the Isomer Classic GitHub repository for the site
  repoName: string;
  // Full domain name that the Isomer Next site will be hosted on
  // (e.g. "www.example.gov.sg", "subsite.example.gov.sg")
  isomerDomain: string;

  // Optional arguments that are only available for custom migration requests
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

export type StudiofyRequest = Pick<
  MigrationRequest,
  "repoName" | "useStagingBranch"
>;

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
