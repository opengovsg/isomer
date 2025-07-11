import moment from "moment";
import {
  convertHtmlToSchema,
  getIsHtmlContainingRedundantDivs,
} from "./converter";
import { getHtmlFromMarkdown } from "./markdown";
import { getManualReviewItems, getResourceRoomFileType } from "./utils";

interface GetIsomerSchemaFromJekyllParams {
  content: string;
  path: string;
}

type GetIsomerSchemaFromJekyllResponse =
  | {
      status: "not_converted";
      permalink: any;
    }
  | {
      status: "converted";
      content: any;
      permalink: any;
      third_nav_title?: any;
    }
  | {
      status: "manual_review";
      content: any;
      permalink: any;
      third_nav_title?: any;
      reviewItems: string[];
    };

export const getIsomerSchemaFromJekyll = async ({
  content,
  path,
}: GetIsomerSchemaFromJekyllParams): Promise<GetIsomerSchemaFromJekyllResponse> => {
  const {
    variant,
    html,
    layout,
    title,
    description,
    image,
    date,
    ref,
    permalink,
    ...rest
  } = getHtmlFromMarkdown(content);

  if (variant === "markdown" && !getIsHtmlContainingRedundantDivs(html)) {
    // Page will need to be flagged for manual conversion
    return {
      status: "not_converted",
      permalink,
    };
  }

  // Pages are either in Tiptap (which we know how to handle), or have redundant
  // or no divs, so we can directly convert to the Isomer Schema
  const convertedContent = await convertHtmlToSchema(html);

  // Check through the output schema to flag out the issues that need manual
  // review (e.g. long/missing alt text, missing table captions, etc)
  const { content: updatedContent, reviewItems } = getManualReviewItems(
    convertedContent,
    content,
    description,
    layout
  );

  const status = reviewItems.length === 0 ? "converted" : "manual_review";

  const fileType = getResourceRoomFileType(path);

  // Map to Isomer Schema
  if (layout === "post" && (!fileType || fileType === "post")) {
    return {
      status,
      permalink,
      reviewItems,
      content: {
        version: "0.1.0",
        layout: "article",
        content: [
          {
            type: "callout",
            content: {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "This article has been migrated from an earlier version of the site and may display formatting inconsistencies.",
                    },
                  ],
                },
              ],
            },
          },
          ...updatedContent,
        ],
        page: {
          title,
          category: "Placeholder", // Note: This will be changed to the actual category in the next step
          date: moment(date).format("DD/MM/YYYY"),
          articlePageHeader: {
            summary: description || "This is the page summary",
          },
        },
        ...((description || image) && {
          meta: {
            description: description.slice(0, 160),
            image: image || undefined,
          },
        }),
      },
      ...rest,
    };
  }

  if (
    layout === "link" ||
    fileType === "link" ||
    layout === "file" ||
    fileType === "file"
  ) {
    const convertedDate = moment(date).format("DD/MM/YYYY");

    return {
      status,
      permalink,
      reviewItems,
      content: {
        version: "0.1.0",
        layout: "link",
        page: {
          title,
          ref,
          category: "Placeholder", // Note: This will be changed to the actual category in the next step
          date: convertedDate,
        },
        content: [],
      },
      ...rest,
    };
  }

  return {
    status,
    permalink,
    content: {
      version: "0.1.0",
      layout: "content",
      content: updatedContent,
      page: {
        title,
        contentPageHeader: {
          summary: description || "This is the page summary",
        },
      },
      ...((description || image) && {
        meta: {
          description: description.slice(0, 160),
          image: image || undefined,
        },
      }),
    },
    reviewItems,
    ...rest,
  };
};
