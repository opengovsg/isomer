import moment from "moment";
import {
  convertHtmlToSchema,
  getIsHtmlContainingRedundantDivs,
} from "./converter";
import { getHtmlFromMarkdown } from "./markdown";
import { getManualReviewItems, getResourceRoomFileType } from "./utils";
import { GetIsomerSchemaFromJekyllResponse } from "./types";
import { isomerSchemaValidator } from "./schema";

const WHITELISTED_LAYOUTS = [
  // From staging branch, for extremely old sites
  "leftnav-page-content",
  "leftnav-page",
  "simple-page",

  // Common layouts
  "default",
  "page",
  "post",
  "link",
  "file",
];

interface GetPageContentProps {
  layout: string | undefined;
  fileType: string | undefined;
  isResourceRoomPage: boolean;
  title: string;
  ref: string | undefined;
  description: string;
  image: string | undefined;
  date: string | undefined;
  updatedDate: string | undefined;
  updatedContent: any[];
}

const getPageContent = ({
  layout,
  fileType,
  isResourceRoomPage,
  title,
  ref,
  description,
  image,
  date,
  updatedDate,
  updatedContent,
}: GetPageContentProps) => {
  const convertedDate = moment(updatedDate, [
    moment.ISO_8601,
    "YYYY-MM-DD",
  ]).format("DD/MM/YYYY");

  if (
    layout === "link" ||
    fileType === "link" ||
    layout === "file" ||
    fileType === "file"
  ) {
    return {
      version: "0.1.0",
      layout: "link",
      page: {
        title,
        ref,
        category: "Placeholder", // Note: This will be changed to the actual category in the next step
        date: convertedDate,
      },
      content: [],
    };
  }

  if (
    isResourceRoomPage &&
    (!fileType || (layout === "post" && fileType === "post"))
  ) {
    return {
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
        date: convertedDate,
        articlePageHeader: {
          summary: description || "This is the page summary",
        },
      },
      ...((description || image) && {
        meta: {
          description,
          image: image || undefined,
        },
      }),
    };
  }

  return {
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
        description,
        image: image || undefined,
      },
    }),
  };
};

interface GetIsomerSchemaFromJekyllParams {
  content: string;
  path: string;
  isResourceRoomPage: boolean;
}

export const getIsomerSchemaFromJekyll = async ({
  content,
  path,
  isResourceRoomPage,
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
      title,
      permalink,
    };
  }

  if (layout !== undefined && !WHITELISTED_LAYOUTS.includes(layout)) {
    // Page layout is not supported for automatic conversion
    return {
      status: "not_converted",
      title,
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

  // Extract date from filename if not present in frontmatter
  // First check if the filename has a date prefix of the form YYYY-MM-DD
  let dateFromFilenameMatch = path.match(/\/(\d{4}-\d{2}-\d{2})-/);
  const updatedDate =
    date || (dateFromFilenameMatch ? dateFromFilenameMatch[1] : undefined);

  const schemaContent = getPageContent({
    layout,
    fileType: !!ref ? "link" : getResourceRoomFileType(path),
    isResourceRoomPage,
    title,
    ref,
    description,
    image,
    date,
    updatedDate,
    updatedContent,
  });

  // Check if the page schema is valid
  const isValidSchema = isomerSchemaValidator(schemaContent);

  if (!isValidSchema) {
    // If schema is invalid, flag for manual review
    reviewItems.push("Page schema is invalid");
  }

  const status = reviewItems.length === 0 ? "converted" : "manual_review";

  return {
    status,
    title,
    permalink,
    reviewItems,
    content: schemaContent,
    ...rest,
  };
};
