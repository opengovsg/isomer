import fs from "fs";
import path from "path";
import {
  NDF_GENERAL_MONOGRAPH_CSV_FILEPATH,
  NDF_PHARMACOLOGICAL_CLASSIFICATIONS_CSV_FILEPATH,
} from "./config";
import { getSimilarKeysAsArray, safeCsvParse } from "./utils";

interface PharmacologicalClassificationEntry {
  code: string;
  name: string;
  children?: PharmacologicalClassificationEntry[];
  monographs?: {
    id: string;
    name: string;
  }[];
}

export const createPharmacologicalClassificationsList = async () => {
  console.log("Creating pharmacological classifications listing page...");

  const pharmaClassificationsData = await safeCsvParse(
    NDF_PHARMACOLOGICAL_CLASSIFICATIONS_CSV_FILEPATH
  );
  const generalMonographData = await safeCsvParse(
    NDF_GENERAL_MONOGRAPH_CSV_FILEPATH
  );
  const filteredGeneralMonographData = generalMonographData.filter(
    (entry) =>
      entry["Publish Status"] === "Active" &&
      entry["Editorial Status"] &&
      ["New", "Revised", "Unchanged"].includes(entry["Editorial Status"])
  );

  // Create the pharmacological classifications tree
  const pharmaClassificationsTree: PharmacologicalClassificationEntry[] = [];

  for (const entry of pharmaClassificationsData) {
    const firstCode = entry["1st level- code"] ?? "";
    const firstDesc = entry["1st level - description"] ?? "";
    const secondCode = entry["2nd level- code"] ?? "";
    const secondDesc = entry["2nd level - description"] ?? "";
    const thirdCode = entry["3rd level- code"] ?? "";
    const thirdDesc = entry["3rd level - description"] ?? "";
    const fourthCode = entry["4th level- code"] ?? "";
    const fourthDesc = entry["4th level - description"] ?? "";

    let firstLevel = pharmaClassificationsTree.find(
      (item) => item.code === firstCode
    );
    if (!firstLevel) {
      firstLevel = { code: firstCode.replaceAll("\n", ""), name: firstDesc };
      pharmaClassificationsTree.push(firstLevel);
    }

    let secondLevel = firstLevel.children?.find(
      (item) => item.code === secondCode
    );
    if (secondCode && secondCode !== "NA") {
      if (!firstLevel.children) firstLevel.children = [];
      if (!secondLevel) {
        secondLevel = {
          code: secondCode.replaceAll("\n", ""),
          name: secondDesc,
        };
        firstLevel.children.push(secondLevel);
      }
    }

    let thirdLevel = secondLevel?.children?.find(
      (item) => item.code === thirdCode
    );
    if (thirdCode && thirdCode !== "NA") {
      if (!secondLevel!.children) secondLevel!.children = [];
      if (!thirdLevel) {
        thirdLevel = { code: thirdCode.replaceAll("\n", ""), name: thirdDesc };
        secondLevel!.children.push(thirdLevel);
      }
    }

    let fourthLevel = thirdLevel?.children?.find(
      (item) => item.code === fourthCode
    );
    if (fourthCode && fourthCode !== "NA") {
      if (!thirdLevel!.children) thirdLevel!.children = [];
      if (!fourthLevel) {
        fourthLevel = {
          code: fourthCode.replaceAll("\n", ""),
          name: fourthDesc,
        };
        thirdLevel!.children.push(fourthLevel);
      }
    }
  }

  // Map monographs to the classifications
  for (const entry of filteredGeneralMonographData) {
    const monographId = entry["Monograph ID"] ?? "";
    const rawMonographName = entry["Monograph Name"] ?? "";
    const monographName = rawMonographName.endsWith(" #")
      ? rawMonographName.slice(0, -2)
      : rawMonographName;
    const atcCodes = getSimilarKeysAsArray(entry, "ATC Chemical Subgroup_");

    for (const atcCode of atcCodes) {
      const levelOne = atcCode.slice(0, 1);
      const levelTwo = atcCode.slice(0, 3);
      const levelThree = atcCode.slice(0, 4);
      const levelFour = atcCode.slice(0, 5);

      const firstLevel = pharmaClassificationsTree.find(
        (item) => item.code === levelOne
      );
      if (!firstLevel) continue;

      if (firstLevel.code === atcCode) {
        firstLevel.monographs ??= [];
        firstLevel.monographs.push({ id: monographId, name: monographName });
        continue;
      }

      const secondLevel = firstLevel.children?.find(
        (item) => item.code === levelTwo
      );
      if (!secondLevel) continue;

      if (secondLevel.code === atcCode) {
        secondLevel.monographs ??= [];
        secondLevel.monographs.push({ id: monographId, name: monographName });
        continue;
      }

      const thirdLevel = secondLevel.children?.find(
        (item) => item.code === levelThree
      );
      if (!thirdLevel) continue;

      if (thirdLevel.code === atcCode) {
        thirdLevel.monographs ??= [];
        thirdLevel.monographs.push({ id: monographId, name: monographName });
        continue;
      }

      const fourthLevel = thirdLevel.children?.find(
        (item) => item.code === levelFour
      );
      if (!fourthLevel) continue;

      if (fourthLevel.code === atcCode) {
        fourthLevel.monographs ??= [];
        fourthLevel.monographs.push({ id: monographId, name: monographName });
        continue;
      }
    }
  }

  // Generate the page JSON
  const outputContent = [];

  for (const firstLevel of pharmaClassificationsTree) {
    const entry = {
      type: "prose",
      content: [
        {
          type: "heading",
          attrs: {
            dir: "ltr",
            level: 2,
          },
          content: [
            {
              type: "text",
              text: `${firstLevel.code}: ${firstLevel.name}`,
            },
          ],
        },
        {
          type: "unorderedList",
          content:
            firstLevel.children?.map((secondLevel) => ({
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `${secondLevel.code}: ${secondLevel.name}`,
                    },
                  ],
                },
                ...(secondLevel.children
                  ? [
                      {
                        type: "unorderedList",
                        content: secondLevel.children.map((thirdLevel) => ({
                          type: "listItem",
                          content: [
                            {
                              type: "paragraph",
                              content: [
                                {
                                  type: "text",
                                  text: `${thirdLevel.code}: ${thirdLevel.name}`,
                                },
                              ],
                            },
                            ...(thirdLevel.children
                              ? [
                                  {
                                    type: "unorderedList",
                                    content: thirdLevel.children.map(
                                      (fourthLevel) => ({
                                        type: "listItem",
                                        content: [
                                          {
                                            type: "paragraph",
                                            content: [
                                              {
                                                type: "text",
                                                text: `${fourthLevel.code}: ${fourthLevel.name}`,
                                              },
                                            ],
                                          },
                                          ...(fourthLevel.monographs
                                            ? [
                                                {
                                                  type: "unorderedList",
                                                  content:
                                                    fourthLevel.monographs.map(
                                                      (monograph) => ({
                                                        type: "listItem",
                                                        content: [
                                                          {
                                                            type: "paragraph",
                                                            content: [
                                                              {
                                                                type: "text",
                                                                marks: [
                                                                  {
                                                                    type: "link",
                                                                    attrs: {
                                                                      href: `/about-drugs/active-ingredient/${monograph.id}/`,
                                                                    },
                                                                  },
                                                                ],
                                                                text: monograph.name,
                                                              },
                                                            ],
                                                          },
                                                        ],
                                                      })
                                                    ),
                                                },
                                              ]
                                            : []),
                                        ],
                                      })
                                    ),
                                  },
                                ]
                              : thirdLevel.monographs
                                ? [
                                    {
                                      type: "unorderedList",
                                      content: thirdLevel.monographs.map(
                                        (monograph) => ({
                                          type: "listItem",
                                          content: [
                                            {
                                              type: "paragraph",
                                              content: [
                                                {
                                                  type: "text",
                                                  marks: [
                                                    {
                                                      type: "link",
                                                      attrs: {
                                                        href: `/about-drugs/active-ingredient/${monograph.id}/`,
                                                      },
                                                    },
                                                  ],
                                                  text: monograph.name,
                                                },
                                              ],
                                            },
                                          ],
                                        })
                                      ),
                                    },
                                  ]
                                : []),
                          ],
                        })),
                      },
                    ]
                  : secondLevel.monographs
                    ? [
                        {
                          type: "unorderedList",
                          content: secondLevel.monographs.map((monograph) => ({
                            type: "listItem",
                            content: [
                              {
                                type: "paragraph",
                                content: [
                                  {
                                    type: "text",
                                    marks: [
                                      {
                                        type: "link",
                                        attrs: {
                                          href: `/about-drugs/active-ingredient/${monograph.id}/`,
                                        },
                                      },
                                    ],
                                    text: monograph.name,
                                  },
                                ],
                              },
                            ],
                          })),
                        },
                      ]
                    : []),
              ],
            })) ?? [],
        },
      ],
    };

    outputContent.push(entry);
  }

  const jsonContent = {
    version: "0.1.0",
    page: {
      contentPageHeader: {
        summary: "View the full list of pharmacological classifications here.",
        showThumbnail: false,
      },
      title: "Listing of Pharmacological Classifications",
    },
    layout: "content",
    content: outputContent,
  };

  // Write to file
  const outputPath = path.join(
    process.cwd(),
    "output",
    "listing-of-pharmacological-classifications.json"
  );
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(jsonContent, null, 2),
    "utf-8"
  );
};
