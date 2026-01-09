import { getHtmlAsJson } from "./getHtmlAsJson";
import fs from "fs";
import Papa from "papaparse";

// Function to convert a string to title case
export const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Function to read and parse a CSV file safely
export const safeCsvParse = async (filePath: string) => {
  const csvFileContent = await fs.promises.readFile(filePath, "utf-8");

  if (!csvFileContent) {
    throw new Error(`CSV file at path ${filePath} is empty or not found.`);
  }

  const parsedCsv = Papa.parse(csvFileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsedCsv.errors.length) {
    throw new Error(
      `Error parsing CSV file: ${JSON.stringify(parsedCsv.errors)}`
    );
  }

  return parsedCsv.data as Record<string, string>[];
};

// Function to get all values that start with the provided key as an array
export const getSimilarKeysAsArray = (
  obj: Record<string, string>,
  key: string
) => {
  const keys = Object.keys(obj).filter((k) => k.startsWith(key));
  return keys
    .map((k) => obj[k])
    .filter((v) => !!v && v.trim() !== "" && v !== "NA") as string[];
};

// Function to get all applicable article tags from an array, or NA if none exist
export const getArticleTags = (tags: string[]) => {
  const articleTags = tags.map((tag) => tag.trim().split("~")[0]);
  return articleTags.length ? articleTags : ["No"];
};

const convertToOrderedList = (text: string): string => {
  // Split the text by numbered items like "1)", "2)", etc.
  const items = text.split(/\d+\)\s*/).filter(Boolean);

  // Wrap each item in <li> tags and preserve <br> tags
  const listItems = items.map((item) => `<li>${item.trim()}</li>`).join("");

  // Remove any <br> tags that are at the end of the list items
  const cleanedListItems = listItems.replace(
    /(<br\s*\/?>\s*)+<\/li>/g,
    "</li>"
  );

  // Wrap everything in an ordered list
  return `<ol>${cleanedListItems}</ol>`;
};

export const extractImagesFromLists = (olUlComponent: any) => {
  const newContentItems: any[] = [];
  let holdingListItemContent: any[] = [];
  let holdingListItemNumber = 1;
  let runningListItemNumber = 1;

  for (const listItem of olUlComponent.content) {
    // Consolidate all the non-image content and extract the images out
    const newListItemContent: any[] = [];
    const imagesOrTableInListItem: any[] = [];

    for (const contentItem of listItem.content) {
      if (contentItem.type === "image" || contentItem.type === "table") {
        imagesOrTableInListItem.push(contentItem);
      } else if (contentItem.type === "heading") {
        // Convert headings into bolded paragraphs
        newListItemContent.push({
          type: "paragraph",
          content: [
            { type: "hardBreak" },
            { type: "hardBreak" },
            ...contentItem.content.map((headingContent: any) => ({
              type: "text",
              text: headingContent.text,
              marks: [
                ...(!!headingContent.marks ? headingContent.marks : []),
                { type: "bold" },
              ],
            })),
            { type: "hardBreak" },
          ],
        });
      } else if (
        contentItem.type === "orderedList" ||
        contentItem.type === "unorderedList"
      ) {
        // Recursively extract images from nested lists
        const extractedNestedListItems = extractImagesFromLists(contentItem);
        for (const extractedItem of extractedNestedListItems) {
          if (
            extractedItem.type === "image" ||
            extractedItem.type === "table"
          ) {
            imagesOrTableInListItem.push(extractedItem);
          } else {
            newListItemContent.push(extractedItem);
          }
        }
      } else {
        newListItemContent.push(contentItem);
      }
    }

    // If there is non-image content, add it as a new list item
    if (newListItemContent.length > 0) {
      holdingListItemContent.push({
        type: "listItem",
        content: newListItemContent,
      });
      runningListItemNumber += 1;
    }

    // If there are images, then flush the holding list items and add the images
    if (imagesOrTableInListItem.length > 0) {
      if (holdingListItemContent.length > 0) {
        newContentItems.push({
          type: olUlComponent.type,
          attrs: {
            ...olUlComponent.attrs,
            start:
              olUlComponent.type === "orderedList" && holdingListItemNumber > 1
                ? holdingListItemNumber
                : undefined,
          },
          content: holdingListItemContent,
        });
        holdingListItemContent = [];
        holdingListItemNumber = runningListItemNumber;
      }

      for (const imageOrTable of imagesOrTableInListItem) {
        if (imageOrTable.attrs === undefined || imageOrTable.type === "table") {
          // Nested imageOrTable that has been processed before
          newContentItems.push(imageOrTable);
          continue;
        }

        newContentItems.push({
          type: "image",
          src: imageOrTable.attrs.src.split("?")[0].split("/").pop(),
          alt: imageOrTable.attrs.alt,
        });
      }
    }
  }

  // If there are any remaining holding list items, flush them out
  if (holdingListItemContent.length > 0) {
    newContentItems.push({
      type: olUlComponent.type,
      attrs: {
        ...olUlComponent.attrs,
        start:
          olUlComponent.type === "orderedList" && holdingListItemNumber > 1
            ? holdingListItemNumber
            : undefined,
      },
      content: holdingListItemContent,
    });
  }

  return newContentItems;
};

// Function to get the contents for the subsidy information section for active
// ingredient page
export const getSubsidyInformation = (str: string) => {
  const pipeSplitParts = str.split(" | ");

  const headingText = pipeSplitParts[0];
  const subsidyType = headingText?.split("~")[0];
  const remainingHeading = headingText?.split("~")[1];
  const heading = `<p><b>[${subsidyType}] ${remainingHeading}</b></p>`;

  if (pipeSplitParts.length < 2) {
    return getHtmlAsJson(heading).content[0].content;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const description = convertToOrderedList(pipeSplitParts[1]!);
  return getHtmlAsJson(`${heading}${description}`).content[0].content;
};

// Function to get the contents of the drug guidance section for active
// ingredient page
export const getDrugGuidance = (
  drugGuidanceStr: string,
  guidanceRecommendationStr: string
) => {
  // Replace "^R~" with "<b>[R]</b>" and "^NR~" with "<b>[NR]</b>"
  const cleanedGuidanceRecommendationStr = guidanceRecommendationStr
    .replace(/NR~<p>/g, "<p><b>[NR]</b> ")
    .replace(/R~<p>/g, "<p><b>[R]</b> ");
  const combinedStr = `${drugGuidanceStr}${cleanedGuidanceRecommendationStr}`;

  return getHtmlAsJson(combinedStr).content[0].content;
};

// Function to get the contents of the general availability section for active
// ingredient page
export const getGeneralAvailability = (str: string) => {
  const pipeSplitParts = str.split(" | ");
  const formulation = pipeSplitParts[0];
  const institutions = pipeSplitParts
    .slice(1)
    .map((part) => `<li>${part.trim()}</li>`)
    .join("");
  const institutionsList = `<ol>${institutions}</ol>`;

  return {
    type: "tableRow",
    content: [
      {
        type: "tableCell",
        content: [
          {
            type: "paragraph",
            attrs: {
              dir: "ltr",
            },
            content: [
              {
                type: "text",
                marks: [
                  {
                    type: "bold",
                  },
                ],
                text: formulation,
              },
            ],
          },
        ],
      },
      {
        type: "tableCell",
        attrs: {
          colspan: 1,
          rowspan: 1,
          colwidth: null,
        },
        content: getHtmlAsJson(institutionsList).content[0].content,
      },
    ],
  };
};

export const getLandingPageRelatedMonographs = (
  relatedMonographs: Record<string, string>[]
) => {
  if (!relatedMonographs.length) {
    return [];
  }

  return [
    {
      type: "prose",
      content: [
        {
          type: "heading",
          attrs: {
            dir: "ltr",
            level: 3,
          },
          content: [
            {
              type: "text",
              text: "List of monographs containing this active ingredient",
            },
          ],
        },
        ...relatedMonographs.map((monograph) => ({
          type: "paragraph",
          attrs: {
            dir: "ltr",
          },
          content: [
            {
              type: "text",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: `/about-drugs/active-ingredient/${monograph["Monograph ID"]}`,
                  },
                },
              ],
              text: monograph["Monograph Name"] ?? "NA",
            },
          ],
        })),
      ],
    },
  ];
};

export const getRouteOfAdministration = (
  matchingProductInfo: Record<string, string>[]
) => {
  // Get all possible routes of administration
  const routes = matchingProductInfo.reduce<string[]>((acc, productInfo) => {
    const route = productInfo["Route of Administration"];

    if (!!route && !acc.includes(route)) {
      acc.push(route);
    }

    return acc;
  }, []);

  if (!routes.length) {
    return [];
  }

  return routes.flatMap((route) => {
    // Make the route name title case
    const routeName = route
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .replaceAll("|", "/");
    const productsForRoute = matchingProductInfo.filter(
      (productInfo) => productInfo["Route of Administration"] === route
    );
    const hasProductsWithClinicalInformation = productsForRoute.some(
      (productInfo) =>
        productInfo.Indications !== "NA" ||
        productInfo.Dosage !== "NA" ||
        productInfo.Contraindications !== "NA"
    );

    return [
      {
        type: "heading",
        attrs: {
          dir: "ltr",
          level: 3,
        },
        content: [
          {
            type: "text",
            text: routeName,
          },
        ],
      },
      {
        type: "unorderedList",
        content: productsForRoute.map((productInfo) => {
          const productName = productInfo["Product Name"] || "NA";
          const licenceNumber =
            productInfo["Licence number (SIN number)"] || "NA";
          const hasClinicalInformation =
            productInfo.Indications !== "NA" ||
            productInfo.Dosage !== "NA" ||
            productInfo.Contraindications !== "NA";

          return {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                attrs: {
                  dir: "ltr",
                },
                content: [
                  {
                    type: "text",
                    marks: [
                      {
                        type: "link",
                        attrs: {
                          href: `/about-drugs/product-information/${licenceNumber}`,
                          target: "_self",
                          rel: "",
                          class: null,
                        },
                      },
                    ],
                    text: `${productName} [${licenceNumber}]${hasClinicalInformation ? "*" : ""}`,
                  },
                ],
              },
            ],
          };
        }),
      },
      ...(hasProductsWithClinicalInformation
        ? [
            {
              type: "paragraph",
              attrs: {
                dir: "ltr",
              },
              content: [
                {
                  type: "text",
                  marks: [
                    {
                      type: "italic",
                    },
                  ],
                  text: "* Clinical information is available for this product.",
                },
              ],
            },
          ]
        : []),
    ];
  });
};

// Function to get a joined paragraph from two inputs separated by " | "
export const getJoinedParagraph = (leftStr: string, rightStr: string) => {
  if (!leftStr || !rightStr) {
    return "NA";
  }

  const activeIngredients = leftStr.split(" | ");
  const strengths = rightStr.split(" | ");
  const combinedStr = activeIngredients
    .map((ingredient, index) => {
      const strength = strengths[index] ? ` - ${strengths[index]}` : "";
      return `${ingredient} ${strength}`;
    })
    .join("<br>");

  // NOTE: The result is always wrapped inside a prose component
  return getHtmlAsJson(combinedStr).content[0].content;
};

// Function to decode all HTML entities in a string
export const decodeHtmlEntities = (str: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
};
