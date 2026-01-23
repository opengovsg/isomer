export type StreamlineScriptType =
  | "migrate-classic-to-next"
  | "generate-dns-records"
  | "verify-dns-records"
  | "site-launch-1st-window"
  | "site-launch-2nd-window";

// Represents a single site as part of the onboarding batch
export interface OnboardingSite {
  // Name of the site, for internal record purporses inside sites.production.csv
  siteName: string;
  // Name of the Isomer Classic GitHub repository for the site
  repoName: string;
  // Full domain name that the Isomer Next site will be hosted on
  // (e.g. "www.example.gov.sg", "subsite.example.gov.sg")
  isomerDomain: string;
  // Optional domain name that redirects to the Isomer Next site
  // (e.g. "example.gov.sg" redirecting to "www.example.gov.sg")
  redirectionDomain?: string;
}

// Represents a single site as part of the site launch batch
export interface SiteLaunchSite {
  // Site ID of the site inside Isomer Studio
  siteId: string;
  // Name of the Isomer Classic GitHub repository for the site
  repoName: string;
  // Full domain name that the Isomer Next site will be hosted on
  // (e.g. "www.example.gov.sg", "subsite.example.gov.sg")
  isomerDomain: string;
  // Optional domain name that redirects to the Isomer Next site
  // (e.g. "example.gov.sg" redirecting to "www.example.gov.sg")
  redirectionDomain?: string;
}
