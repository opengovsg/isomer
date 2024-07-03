import { type Resource } from "@isomer/db";
import {
  type IsomerPageSchema,
  type IsomerSiteProps,
} from "@opengovsg/isomer-components";
import { type SetRequired } from "type-fest";

export type PageContent = Omit<
  IsomerPageSchema,
  "layout" | "LinkComponent" | "ScriptComponent"
>;

export type Page = SetRequired<Resource, "blobId">;

export interface Navbar {
  items: IsomerSiteProps["navBarItems"];
}

export type Footer = IsomerSiteProps["footerItems"];
