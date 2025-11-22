import moment from "moment";
import {
  convertHtmlToSchema,
  getIsHtmlContainingRedundantDivs,
} from "./converter";
import { getHtmlFromMarkdown } from "./markdown";
import { getManualReviewItems, getResourceRoomFileType } from "./utils";
import type { GetIsomerSchemaFromJekyllResponse } from "./types";
import { isomerSchemaValidator } from "./schema";
import { PLACEHOLDER_ALT_TEXT, PLACEHOLDER_PAGE_SUMMARY } from "./constants";
import { generateImageAltText, generatePageSummary } from "./ai";

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
          summary: description || PLACEHOLDER_PAGE_SUMMARY,
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
        summary: description || PLACEHOLDER_PAGE_SUMMARY,
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
  site: string;
  domain?: string;
}

export const getIsomerSchemaFromJekyll = async ({
  content,
  path,
  isResourceRoomPage,
  site,
  domain,
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
  const { content: updatedContent, reviewItems } = await getManualReviewItems(
    convertedContent,
    content,
    description,
    layout
  );

  // Extract date from filename if not present in frontmatter
  // First check if the filename has a date prefix of the form YYYY-MM-DD
  const dateFromFilenameMatch = /\/(\d{4}-\d{2}-\d{2})-/.exec(path);
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

  // Enhance placeholder texts with AI-generated ones where possible
  const updatedSchemaContent: any[] = [];
  for (const block of schemaContent.content) {
    if (
      (block.type === "image" || block.type === "contentpic") &&
      block.src &&
      (block.alt === PLACEHOLDER_ALT_TEXT || block.alt.length < 10)
    ) {
      // Generate alt text for images with missing or very short alt text
      const fullSrc = block.src.startsWith("http")
        ? block.src
        : domain
          ? `${domain}${block.src}`
          : `https://raw.githubusercontent.com/isomerpages/${site}/staging${block.src}`;
      const generatedAltText = await generateImageAltText(fullSrc);

      updatedSchemaContent.push({
        ...block,
        alt: generatedAltText,
      });
      reviewItems.push(
        "AI-generated alt text were used for images with missing alt text"
      );
    } else {
      updatedSchemaContent.push(block);
    }
  }
  schemaContent.content = updatedSchemaContent;

  // Provide an AI-generated page summary if none exists
  if (
    schemaContent.page?.contentPageHeader?.summary ===
      PLACEHOLDER_PAGE_SUMMARY ||
    schemaContent.page?.articlePageHeader?.summary === PLACEHOLDER_PAGE_SUMMARY
  ) {
    const pageContentString = JSON.stringify(convertedContent);
    const aiGeneratedSummary = await generatePageSummary(pageContentString);

    if (schemaContent.page?.contentPageHeader) {
      schemaContent.page.contentPageHeader.summary = aiGeneratedSummary;
    } else if (schemaContent.page?.articlePageHeader) {
      schemaContent.page.articlePageHeader.summary = aiGeneratedSummary;
    }

    reviewItems.push(
      "AI-generated page summary was used for pages without a summary"
    );
  }

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
