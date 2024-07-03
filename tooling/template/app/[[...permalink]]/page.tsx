import type { IsomerPageSchema } from "@opengovsg/isomer-components";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import {
  getMetadata,
  getSitemapXml,
  RenderEngine,
} from "@opengovsg/isomer-components";
import config from "#data/config";
import footer from "#data/footer";
import navbar from "#data/navbar";

import sitemap from "../../sitemap.json";

interface DynamicPageProps {
  params: {
    permalink: string[];
  };
}

const timeNow = new Date();
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear();

const getSchema = async (
  permalink: DynamicPageProps["params"]["permalink"],
) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (permalink && permalink.length > 0 && typeof permalink !== "string") {
    const joinedPermalink = permalink.join("/");

    const schema = (await import(`../../schema/${joinedPermalink}`).then(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      (module) => module.default,
    )) as IsomerPageSchema;

    const lastModified =
      // @ts-expect-error type mismatch
      getSitemapXml(sitemap).find(
        ({ url }) => permalink.join("/") === url.replace(/^\//, ""),
      )?.lastModified || new Date().toISOString();

    schema.page.permalink = "/" + joinedPermalink;
    schema.page.lastModified = lastModified;

    return schema;
  }

  const schema = (await import("../../schema/index.json").then(
    (module) => module.default,
  )) as IsomerPageSchema;

  const lastModified =
    // @ts-expect-error type mismatch
    getSitemapXml(sitemap).find(({ url }) => url === "/")?.lastModified ||
    new Date().toISOString();

  schema.page.permalink = "/";
  schema.page.lastModified = lastModified;

  return schema;
};

export const generateStaticParams = () => {
  // @ts-expect-error type mismatch
  return getSitemapXml(sitemap).map(({ url }) => ({
    permalink: url.replace(/^\//, "").split("/"),
  }));
};

export const generateMetadata = async (
  { params }: DynamicPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const { permalink } = params;
  const schema = await getSchema(permalink);
  schema.site = {
    ...config.site,
    // eslint-disable-next-line no-restricted-properties
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // @ts-expect-error type mismatch
    siteMap: sitemap,
    navBarItems: navbar,
    // @ts-expect-error type mismatch
    footerItems: footer,
    lastUpdated,
  };
  return getMetadata(schema);
};

const Page = async ({ params }: DynamicPageProps) => {
  const { permalink } = params;
  const renderSchema = await getSchema(permalink);

  return (
    <>
      <RenderEngine
        version={renderSchema.version}
        site={{
          ...config.site,
          // eslint-disable-next-line no-restricted-properties
          environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          // @ts-expect-error type mismatch
          siteMap: sitemap,
          navBarItems: navbar,
          // @ts-expect-error type mismatch
          footerItems: footer,
          lastUpdated,
        }}
        layout={renderSchema.layout}
        page={renderSchema.page}
        content={renderSchema.content}
        LinkComponent={Link}
      />
    </>
  );
};

export default Page;
