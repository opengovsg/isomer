import type { IsomerSitemap } from "./sitemap";
import type { NavbarProps } from "~/interfaces";
import type { SiteConfigFooterProps } from "~/interfaces/internal/Footer";

export interface IsomerGeneratedSiteProps {
  siteMap: IsomerSitemap;
  environment?: string;
  lastUpdated: string;
}

export interface IsomerSiteWideComponentsProps {
  navBarItems: NavbarProps["items"];
  footerItems: SiteConfigFooterProps;
}

export interface IsomerSiteConfigProps {
  siteName: string;
  url?: string;
  agencyName?: string;
  theme: "isomer-classic" | "isomer-next";
  logoUrl: string;
  isGovernment?: boolean;
  favicon?: string;
  search: NavbarProps["search"];
  notification?: string;
}

export type IsomerSiteProps = IsomerGeneratedSiteProps &
  IsomerSiteWideComponentsProps &
  IsomerSiteConfigProps;
