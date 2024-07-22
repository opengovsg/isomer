import type { IsomerComponent } from "@opengovsg/isomer-components";

// TODO: add in default blocks for remaining
export const DEFAULT_BLOCKS: Record<
  IsomerComponent["type"],
  IsomerComponent | undefined
> = {
  prose: {
    type: "prose",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      },
    ],
  },
  accordion: {
    type: "accordion",
    summary: "",
    details: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "",
            },
          ],
        },
      ],
    },
  },
  button: {
    type: "button",
    label: "",
    href: "",
  },
  callout: {
    type: "callout",
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "",
            },
          ],
        },
      ],
    },
    variant: "info"
  },
  // NOTE: This can't be added
  hero: undefined,
  // NOTE: Skipping this for now
  // This is technically 3 components: 
  // google maps/youtube/formsg
  iframe: undefined,
  // NOTE: Skipping because backend not done
  image: undefined,
  // NOTE: infobar
  infobar: {
    type: "infobar",
    title: ""
  },
  infocards: {
    type: "infocards",
    variant: "top",
    cards: [
      {
        title: "",
        url: "",
        imageUrl: "",
        imageAlt: "",
      }
    ]
  },
  infocols: {
    title: "",
    type: "infocols",
    infoBoxes: [
      { title: "" },
    ],
  },
  infopic: {
    type: "infopic",
    title: "",
    imageSrc: "",
  },
  keystatistics: {
    type: "keystatistics",
    variant: "side",
    title: "",
    statistics: [
      {
        label: "",
        value: ""
      }
    ]
  },
}
