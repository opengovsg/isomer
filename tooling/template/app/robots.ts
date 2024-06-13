import config from "@/data/config.json";
import footer from "@/data/footer.json";
import navbar from "@/data/navbar.json";
import { getRobotsTxt } from "@opengovsg/isomer-components";
import type { MetadataRoute } from "next";

const timeNow = new Date();
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear();

export default function robots(): MetadataRoute.Robots {
  return getRobotsTxt({
    site: {
      ...config.site,
      navBarItems: navbar,
      // @ts-expect-error blah
      footerItems: footer,
      lastUpdated,
    },
  });
}
