import { CalloutProps } from "@opengovsg/isomer-components";

export const MIGRATION_CALLOUT = {
  type: "callout",
  content: {
    type: "prose",
    content: [
      {
        type: "paragraph",
        attrs: {
          dir: "ltr",
        },
        content: [
          {
            type: "text",
            text: "This article has been migrated from an earlier version of the site and may display formatting inconsistencies.",
          },
        ],
      },
    ],
  },
} satisfies Omit<CalloutProps, "site">;

// NOTE: This denotes the state of the repo as is
// prior to `jekyll build` being executed
export const REPO_DIR = "_repo";
// NOTE: This refers to the output directory
// after `jekyll build` is executed
export const SITE_DIR = "_site";
