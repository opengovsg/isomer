import { getHtmlAsJson } from "./getHtmlAsJson";
import {
  getJoinedParagraph,
  getDrugGuidance,
  getGeneralAvailability,
  getSubsidyInformation,
  decodeHtmlEntities,
  getRouteOfAdministration,
  getLandingPageRelatedMonographs,
  toTitleCase,
} from "./utils";

interface MonographPageProps {
  activeIngredients: string[];
  synomyms: string[];
  monographName: string;
  subsidyInfo: string[];
  drugGuidance: string[];
  postMarketingInfo: string[];
  guidanceRecommendation: string[];
  generalAvailability: string[];
  additionalInformation: string;
  matchingProductInfo: Record<string, string>[];
  landingPageRelatedMonographs: Record<string, string>[];
}

export const getMonographPage = ({
  activeIngredients,
  synomyms,
  monographName,
  subsidyInfo,
  drugGuidance,
  postMarketingInfo,
  guidanceRecommendation,
  additionalInformation,
  generalAvailability,
  matchingProductInfo,
  landingPageRelatedMonographs,
}: MonographPageProps) => {
  const monographNameFirstChar = monographName.charAt(0).toUpperCase();
  const subsidyInfoTags = [
    ...new Set(subsidyInfo.map((info) => info.trim().split("~")[0])),
  ];
  const isSummaryOfBiologics =
    monographName.endsWith("#") || landingPageRelatedMonographs.length > 0;

  return {
    page: {
      title: decodeHtmlEntities(monographName),
      tags: [
        {
          category: "Subsidy Information and Financing Scheme",
          selected: subsidyInfoTags.length ? subsidyInfoTags : ["No"],
        },
        {
          category: "Drug Guidance",
          selected: drugGuidance.length ? ["Yes"] : ["No"],
        },
        {
          category: "Post-marketing information",
          selected: postMarketingInfo.length ? ["Yes"] : ["No"],
        },
        {
          category: "Summary of Biologics",
          selected: isSummaryOfBiologics ? ["Yes"] : ["No"],
        },
      ],
      category: monographNameFirstChar,
      articlePageHeader: {
        summary: `Active ingredient${activeIngredients.length === 1 ? "" : "s"}: ${activeIngredients.join(" | ")}${synomyms.length ? `\nSynonym${synomyms.length === 1 ? "" : "s"}: ${synomyms.join(" | ")}` : ""}`,
        showThumbnail: false,
      },
    },
    layout: "article",
    content: [
      {
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
                text: "General information",
                type: "text",
              },
            ],
          },
        ],
      },
      {
        type: "accordion",
        details: {
          type: "prose",
          content: subsidyInfo.length
            ? [
                ...subsidyInfo.flatMap((info) => getSubsidyInformation(info)),
                {
                  type: "divider",
                },
                {
                  type: "paragraph",
                  attrs: {
                    dir: "ltr",
                  },
                  content: [
                    {
                      text: "Legend",
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "paragraph",
                  attrs: {
                    dir: "ltr",
                  },
                  content: [
                    {
                      text: "This section shows the following:",
                      type: "text",
                    },
                  ],
                },
                {
                  type: "unorderedList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            dir: "ltr",
                          },
                          content: [
                            {
                              text: "Subsidy Scheme and Clinical Indication",
                              type: "text",
                              marks: [
                                {
                                  type: "bold",
                                },
                              ],
                            },
                            {
                              text: " (where applicable) of drugs listed in the ",
                              type: "text",
                            },
                            {
                              text: "MOH List of Subsidised Drugs",
                              type: "text",
                              marks: [
                                {
                                  type: "link",
                                  attrs: {
                                    rel: "",
                                    href: "https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/list-of-subsidised-drugs/",
                                    class:
                                      "focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:decoration-transparent focus-visible:shadow-focus-visible focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent outline-none outline-0",
                                    target: "_self",
                                  },
                                },
                                {
                                  type: "bold",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            dir: "ltr",
                          },
                          content: [
                            {
                              text: "Subsidised brands of vaccines",
                              type: "text",
                              marks: [
                                {
                                  type: "bold",
                                },
                              ],
                            },
                            {
                              text: " recommended in the National Immunisation Schedules listed in the ",
                              type: "text",
                            },
                            {
                              text: "MOH Subsidised Vaccine List",
                              type: "text",
                              marks: [
                                {
                                  type: "link",
                                  attrs: {
                                    rel: "",
                                    href: "https://www.moh.gov.sg/others/subsidised-vaccine-list/",
                                    class:
                                      "focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:decoration-transparent focus-visible:shadow-focus-visible focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent outline-none outline-0",
                                    target: "_self",
                                  },
                                },
                                {
                                  type: "bold",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            dir: "ltr",
                          },
                          content: [
                            {
                              text: "Cancer Drug and Clinical Indication",
                              type: "text",
                              marks: [
                                {
                                  type: "bold",
                                },
                              ],
                            },
                            {
                              text: " listed in the ",
                              type: "text",
                            },
                            {
                              text: "MediShield Life Cancer Drug List",
                              type: "text",
                              marks: [
                                {
                                  type: "link",
                                  attrs: {
                                    rel: "",
                                    href: "https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medishield-life/cancer-drug-list/",
                                    class:
                                      "focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:decoration-transparent focus-visible:shadow-focus-visible focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent outline-none outline-0",
                                    target: "_self",
                                  },
                                },
                                {
                                  type: "bold",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "paragraph",
                  attrs: {
                    dir: "ltr",
                  },
                  content: [
                    {
                      text: "As this website is updated monthly, please refer to MOH List of Subsidised Drugs, MOH Subsidised Vaccine List or MediShield Life Cancer Drug List for the most updated information.",
                      type: "text",
                    },
                  ],
                },
                {
                  type: "table",
                  attrs: {
                    caption: "Legend list",
                  },
                  content: [
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableHeader",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "Indicator",
                                  type: "text",
                                  marks: [
                                    {
                                      type: "bold",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "tableHeader",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "Legend",
                                  type: "text",
                                  marks: [
                                    {
                                      type: "bold",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableCell",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "SDL",
                                  type: "text",
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
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "Standard Drug List",
                                  type: "text",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableCell",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "MAF",
                                  type: "text",
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
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "Medical Assistance Fund",
                                  type: "text",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableCell",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "SVL",
                                  type: "text",
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
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "Subsidised Vaccine List",
                                  type: "text",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableCell",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "MSHL",
                                  type: "text",
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
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  text: "Cancer Drug and Clinical Indication listed in the MediShield Life Cancer Drug List",
                                  type: "text",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ]
            : [
                {
                  type: "paragraph",
                  attrs: {
                    dir: "ltr",
                  },
                  content: [
                    {
                      type: "text",
                      text: "Not Applicable",
                    },
                  ],
                },
              ],
        },
        summary: "Subsidy Information and Financing Scheme",
      },
      {
        type: "accordion",
        details: {
          type: "prose",
          content: drugGuidance.length
            ? [
                ...drugGuidance.flatMap((info, index) =>
                  getDrugGuidance(info, guidanceRecommendation[index] || "")
                ),
                {
                  type: "divider",
                },
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
                      text: "Legend",
                    },
                  ],
                },
                {
                  type: "paragraph",
                  attrs: {
                    dir: "ltr",
                  },
                  content: [
                    {
                      type: "text",
                      text: "This section displays recommendation from the MOH Drug Advisory Committee for subsidy and appropriate use of the drug as extracted from the Agency for Care Effectiveness (ACE) Drug Guidances. As this website is updated monthly, please refer to the ",
                    },
                    {
                      type: "text",
                      marks: [
                        {
                          type: "link",
                          attrs: {
                            href: "https://www.ace-hta.gov.sg/healthcare-professionals/ace-technology-guidances",
                            target: "_blank",
                            rel: "noopener nofollow",
                            class:
                              "focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:decoration-transparent focus-visible:shadow-focus-visible focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent outline-none outline-0",
                          },
                        },
                      ],
                      text: "ACE website",
                    },
                    {
                      type: "text",
                      text: " for the most updated information.",
                    },
                  ],
                },
                {
                  type: "table",
                  attrs: {
                    caption: "Legend list",
                  },
                  content: [
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableHeader",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
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
                                  text: "Indicator",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "tableHeader",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
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
                                  text: "Legend",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableCell",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "R",
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
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "Recommended for subsidy",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableCell",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "NR",
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
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "Not recommended for subsidy",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ]
            : [
                {
                  type: "paragraph",
                  attrs: {
                    dir: "ltr",
                  },
                  content: [
                    {
                      type: "text",
                      text: "Not Applicable",
                    },
                  ],
                },
              ],
        },
        summary: "Drug Guidance for Subsidy",
      },
      ...(postMarketingInfo.length
        ? [
            {
              type: "accordion",
              summary: "Post Marketing Information",
              details: {
                type: "prose",
                content: [
                  ...postMarketingInfo.flatMap(
                    (info) => getHtmlAsJson(info).content[0].content
                  ),
                  {
                    type: "divider",
                  },
                  {
                    type: "paragraph",
                    attrs: {
                      dir: "ltr",
                    },
                    content: [
                      {
                        text: "Educational materials for healthcare professionals",
                        type: "text",
                        marks: [
                          {
                            type: "bold",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: "paragraph",
                    attrs: {
                      dir: "ltr",
                    },
                    content: [
                      {
                        type: "text",
                        text: "Educational materials highlight specific safety concerns associated with the use of selected therapeutic products and provide advice on the actions required to optimize safe and effective use of these products.",
                      },
                    ],
                  },
                  {
                    type: "paragraph",
                    attrs: {
                      dir: "ltr",
                    },
                    content: [
                      {
                        type: "text",
                        text: "Only educational materials approved by the Health Sciences Authority of Singapore (HSA) are listed. These materials are published with the agreement of the company responsible for producing them and are not intended to replace medical advice offered by healthcare professionals (HCP). As this website is updated monthly, please refer to ",
                      },
                      {
                        type: "text",
                        marks: [
                          {
                            type: "link",
                            attrs: {
                              href: "https://www.hsa.gov.sg/educational-materials-for-HCP",
                              target: "_self",
                              rel: "",
                              class: null,
                            },
                          },
                        ],
                        text: "HSA website",
                      },
                      {
                        type: "text",
                        text: " for the most updated information.",
                      },
                    ],
                  },
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
                        text: "Dear Healthcare Professional Letters (DHCPLs)",
                      },
                    ],
                  },
                  {
                    type: "paragraph",
                    attrs: {
                      dir: "ltr",
                    },
                    content: [
                      {
                        type: "text",
                        text: "Dear Healthcare Professional Letters (DHCPL) are letters issued by a manufacturer or the HSA to healthcare professionals to communicate new or emerging safety, efficacy or quality information associated with the use of specific marketed therapeutic products.  As this website is updated monthly, please refer to ",
                      },
                      {
                        type: "text",
                        marks: [
                          {
                            type: "link",
                            attrs: {
                              href: "https://www.hsa.gov.sg/announcements?contenttype=dear%20healthcare%20professional%20letters)",
                              target: "_self",
                              rel: "",
                              class: null,
                            },
                          },
                        ],
                        text: "HSA website ",
                      },
                      {
                        type: "text",
                        text: "for the most updated information.",
                      },
                    ],
                  },
                ],
              },
            },
          ]
        : []),
      ...(generalAvailability.length
        ? [
            {
              type: "accordion",
              summary: "General Availability in Public Healthcare Institution",
              details: {
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
                        marks: [
                          {
                            type: "bold",
                          },
                        ],
                        text: "Note:",
                      },
                    ],
                  },
                  {
                    type: "paragraph",
                    attrs: {
                      dir: "ltr",
                    },
                    content: [
                      {
                        type: "text",
                        text: "General availability information reflected is based on the Public Healthcare Institutions’ (PHI) formulary on what is commonly used for treating their patient population and may or may not be available for patients not under the care of that institution. It does not reflect the PHI’s actual inventory availability and is subjected to change. Please consult the ",
                      },
                      {
                        type: "text",
                        marks: [
                          {
                            type: "link",
                            attrs: {
                              href: "https://www.sgdi.gov.sg/other-organisations/hospitals",
                              target: "_blank",
                              rel: "noopener nofollow",
                              class:
                                "focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:decoration-transparent focus-visible:shadow-focus-visible focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent outline-none outline-0",
                            },
                          },
                        ],
                        text: "Public Hospitals",
                      },
                      {
                        type: "text",
                        text: " or ",
                      },
                      {
                        type: "text",
                        marks: [
                          {
                            type: "link",
                            attrs: {
                              href: "https://www.sgdi.gov.sg/other-organisations/polyclinics",
                              target: "_blank",
                              rel: "noopener nofollow",
                              class:
                                "focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:decoration-transparent focus-visible:shadow-focus-visible focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent outline-none outline-0",
                            },
                          },
                        ],
                        text: "Polyclinics",
                      },
                      {
                        type: "text",
                        text: " for details on availability and supply restrictions/considerations. General availability is not tied to any brand unless otherwise stated.",
                      },
                    ],
                  },
                  {
                    type: "divider",
                  },
                  {
                    type: "paragraph",
                    attrs: {
                      dir: "ltr",
                    },
                    content: [
                      {
                        type: "text",
                        text: "Users are to consult the respective PHIs for actual inventory availability and supply restrictions/consideration",
                      },
                    ],
                  },
                  {
                    type: "table",
                    attrs: {
                      caption: "Drug availability",
                    },
                    content: [
                      {
                        type: "tableRow",
                        content: [
                          {
                            type: "tableHeader",
                            attrs: {
                              colspan: 1,
                              rowspan: 1,
                              colwidth: null,
                            },
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
                                    text: "Formulation",
                                  },
                                ],
                              },
                            ],
                          },
                          {
                            type: "tableHeader",
                            attrs: {
                              colspan: 1,
                              rowspan: 1,
                              colwidth: null,
                            },
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
                                    text: "Public Healthcare Institution",
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      ...generalAvailability.map((info) =>
                        getGeneralAvailability(info)
                      ),
                    ],
                  },
                ],
              },
            },
          ]
        : []),
      ...(additionalInformation !== "NA"
        ? [
            {
              type: "accordion",
              summary: "Additional Information",
              details: {
                type: "prose",
                content: [
                  ...getHtmlAsJson(additionalInformation).content[0].content,

                  {
                    type: "divider",
                  },
                  {
                    type: "paragraph",
                    attrs: {
                      dir: "ltr",
                    },
                    content: [
                      {
                        type: "text",
                        text: "This section shows additional information related to the monograph such as drugs that are approved for funding under the Rare Disease Fund.",
                      },
                    ],
                  },
                ],
              },
            },
          ]
        : []),
      ...(landingPageRelatedMonographs.length
        ? getLandingPageRelatedMonographs(landingPageRelatedMonographs)
        : [
            {
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
                      text: "Registered Product(s) Information",
                    },
                  ],
                },
                {
                  type: "table",
                  attrs: {
                    caption: "Clinical and product info",
                  },
                  content: [
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableHeader",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "Clinical info",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "tableHeader",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "Product Info",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableRow",
                      content: [
                        {
                          type: "tableCell",
                          attrs: {
                            colspan: 1,
                            rowspan: 1,
                            colwidth: null,
                          },
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "Information under the Indication, Dosage and Contraindication sections are extracted from the relevant Package Insert/Patient Information Leaflet of the product available on HSA Infosearch. For more information, please refer to the product's Package Insert/ Patient Information Leaflet available on ",
                                },
                                {
                                  type: "text",
                                  marks: [
                                    {
                                      type: "link",
                                      attrs: {
                                        href: "https://eservice.hsa.gov.sg/prism/common/enquirepublic/SearchDRBProduct.do?action=load&_ga=2.183810082.563179921.1554083187-551332391.1551944793",
                                        target: "_self",
                                        rel: "",
                                        class: null,
                                      },
                                    },
                                  ],
                                  text: "HSA Infosearch",
                                },
                                {
                                  type: "text",
                                  text: ".",
                                },
                              ],
                            },
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "The information provided is for informational purposes only, and is not exhaustive. The information provided is not a substitute for professional medical advice. Please consult a qualified healthcare provider for any medical advice.",
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
                          content: [
                            {
                              type: "paragraph",
                              attrs: {
                                dir: "ltr",
                              },
                              content: [
                                {
                                  type: "text",
                                  text: "Information available here are product details as registered with the HSA. As this website is updated monthly, please refer to ",
                                },
                                {
                                  type: "text",
                                  marks: [
                                    {
                                      type: "link",
                                      attrs: {
                                        href: "https://eservice.hsa.gov.sg/prism/common/enquirepublic/SearchDRBProduct.do?action=load&_ga=2.183810082.563179921.1554083187-551332391.1551944793",
                                        target: "_self",
                                        rel: "",
                                        class: null,
                                      },
                                    },
                                  ],
                                  text: "HSA Infosearch",
                                },
                                {
                                  type: "text",
                                  text: " for the most updated product information.",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                ...getRouteOfAdministration(matchingProductInfo),
              ],
            },
          ]),
    ],
    version: "0.1.0",
  };
};

interface ProductInformationPageProps {
  productName: string;
  licenseNumber: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  countryOfManufacture: string;
  licenseHolder: string;
  forensicClassification: string;
  atcCode: string;
  exemptions: string;
  indications: string;
  dosage: string;
  contraindications: string;
}

export const getProductInformationPage = ({
  productName,
  licenseNumber,
  activeIngredient,
  strength,
  dosageForm,
  manufacturer,
  countryOfManufacture,
  licenseHolder,
  forensicClassification,
  atcCode,
  exemptions,
  indications,
  dosage,
  contraindications,
}: ProductInformationPageProps) => {
  return {
    page: {
      contentPageHeader: {
        summary: `Active ingredients: ${decodeHtmlEntities(productName)}`,
        showThumbnail: false,
      },
      title: `${decodeHtmlEntities(productName)} [${licenseNumber}]`,
    },
    layout: "content",
    content: [
      {
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
                text: "Product Info",
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              dir: "ltr",
              level: 3,
            },
            content: [
              {
                type: "text",
                text: decodeHtmlEntities(productName),
              },
            ],
          },
          {
            type: "paragraph",
            attrs: {
              dir: "ltr",
            },
            content: [
              {
                type: "text",
                text: `[${licenseNumber}]`,
              },
            ],
          },
          {
            type: "table",
            attrs: {
              caption: "Product information",
            },
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Active Ingredient and Strength",
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
                    content: getJoinedParagraph(activeIngredient, strength),
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Dosage Form",
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
                    content: [
                      {
                        type: "paragraph",
                        attrs: {
                          dir: "ltr",
                        },
                        content: [
                          {
                            type: "text",
                            text: dosageForm,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Manufacturer and Country",
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
                    content: getJoinedParagraph(
                      manufacturer,
                      countryOfManufacture
                    ),
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Registration Number",
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
                    content: [
                      {
                        type: "paragraph",
                        attrs: {
                          dir: "ltr",
                        },
                        content: [
                          {
                            type: "text",
                            text: licenseNumber,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Licence Holder",
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
                    content: [
                      {
                        type: "paragraph",
                        attrs: {
                          dir: "ltr",
                        },
                        content: [
                          {
                            type: "text",
                            text: decodeHtmlEntities(licenseHolder),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Forensic Classification",
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
                    content: [
                      {
                        type: "paragraph",
                        attrs: {
                          dir: "ltr",
                        },
                        content: [
                          {
                            type: "text",
                            text: forensicClassification,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Anatomical Therapeutic Chemical (ATC) code",
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
                    content: [
                      {
                        type: "paragraph",
                        attrs: {
                          dir: "ltr",
                        },
                        content: [
                          {
                            type: "text",
                            text: atcCode,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: {
                      colspan: 1,
                      rowspan: 1,
                      colwidth: null,
                    },
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
                            text: "Prescription-only Medicines with Exemptions for Supply without Prescription",
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
                    content:
                      getHtmlAsJson(exemptions).content.find(
                        (c: any) => c.type === "prose"
                      ).content || [],
                  },
                ],
              },
            ],
          },
        ],
      },
      ...(indications !== "NA"
        ? [
            {
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
                      text: "Indication",
                      type: "text",
                    },
                  ],
                },
              ],
            },
            ...getHtmlAsJson(indications).content,
          ]
        : []),
      ...(dosage !== "NA"
        ? [
            {
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
                      text: "Dosing",
                      type: "text",
                    },
                  ],
                },
              ],
            },
            ...getHtmlAsJson(dosage).content,
          ]
        : []),
      ...(contraindications !== "NA"
        ? [
            {
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
                      text: "Contraindications",
                      type: "text",
                    },
                  ],
                },
              ],
            },
            ...getHtmlAsJson(contraindications).content,
          ]
        : []),
    ],
    version: "0.1.0",
  };
};

interface ProductInformationLinkProps {
  productName: string;
  activeIngredient: string;
  licenseNumber: string;
  indications: string;
  dosage: string;
  contraindications: string;
  manufacturer: string;
  countryOfManufacture: string;
  routeOfAdministration: string;
  forensicClassification: string;
}

export const getProductInformationLink = ({
  productName,
  activeIngredient,
  licenseNumber,
  indications,
  dosage,
  contraindications,
  manufacturer,
  countryOfManufacture,
  routeOfAdministration,
  forensicClassification,
}: ProductInformationLinkProps) => {
  const routeOfAdmnistrationTags = routeOfAdministration
    .split("|")
    .map((r) => toTitleCase(r.trim()));
  const category = toTitleCase(forensicClassification);
  const clinicalInformation =
    indications === "NA" && dosage === "NA" && contraindications === "NA"
      ? "No"
      : "Yes";
  const manufacturerTags = manufacturer
    .split("|")
    .map((m) => decodeHtmlEntities(m.trim()));
  const countryOfManufactureTags = countryOfManufacture
    .split("|")
    .map((c) => decodeHtmlEntities(c.trim()));

  return {
    version: "0.1.0",
    layout: "link",
    page: {
      title: `${decodeHtmlEntities(productName)} [${licenseNumber}]`,
      ref: `/about-drugs/product-information/${licenseNumber}`,
      description: `Active ingredients: ${decodeHtmlEntities(activeIngredient)}`,
      category,
      tags: [
        {
          category: "1. Clinical information",
          selected: [clinicalInformation],
        },
        {
          category: "2. Route of Administration",
          selected: routeOfAdmnistrationTags,
        },
        {
          category: "3. Manufacturer",
          selected: manufacturerTags,
        },
        {
          category: "4. Country of Manufacturer",
          selected: countryOfManufactureTags,
        },
      ],
    },
    content: [],
  };
};
