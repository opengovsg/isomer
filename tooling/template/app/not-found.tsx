import type { IsomerPageSchema } from "@opengovsg/isomer-components";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { getMetadata, RenderEngine } from "@opengovsg/isomer-components";
import config from "#data/config";
import footer from "#data/footer";
import navbar from "#data/navbar";

import sitemap from "../sitemap.json";

const PAGE_TITLE = "404: Page not found";
const PAGE_DESCRIPTION = "The page that you are accessing does not exist";
const PAGE_SCHEMA_VERSION = "0.1.0";

const timeNow = new Date();
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear();

export const generateMetadata = async (
  props: never,
  parent: ResolvingMetadata,
): Promise<Metadata> => {
  const schema = (await import("../schema/index.json").then(
    (module) => module.default,
  )) as IsomerPageSchema;
  schema.site = {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // @ts-ignore blah
    siteMap: sitemap,
    navBarItems: navbar,
    // @ts-ignore blah
    footerItems: footer,
    lastUpdated,
  };
  schema.page.permalink = "/404.html";
  schema.page.title = PAGE_TITLE;
  schema.page.description = PAGE_DESCRIPTION;
  return getMetadata(schema);
};

const NotFound = () => {
  return (
    <>
      <RenderEngine
        version={PAGE_SCHEMA_VERSION}
        site={{
          ...config.site,
          environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          // @ts-ignore blah
          siteMap: sitemap,
          navBarItems: navbar,
          // @ts-ignore blah
          footerItems: footer,
        }}
        layout="notfound"
        page={{
          title: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          permalink: "/404.html",
          lastModified: new Date().toISOString(),
        }}
        content={[]}
        LinkComponent={Link}
      />
    </>
  );
};

export default NotFound;
