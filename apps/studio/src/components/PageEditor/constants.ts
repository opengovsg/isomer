import type { IsomerComponent } from "@opengovsg/isomer-components"

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
    summary: "Title for the accordion item",
    details: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Enter content for the accordion here.",
            },
          ],
        },
      ],
    },
  },
  button: {
    type: "button",
    label: "Button label",
    href: "/button-url",
    colorScheme: "black",
    variant: "solid",
    size: "base",
    rightIcon: "right-arrow",
  },
  callout: {
    type: "callout",
    variant: "info",
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Callout content",
            },
          ],
        },
      ],
    },
  },
  hero: undefined,
  iframe: {
    type: "iframe",
    title: "YouTube embed",
    content:
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=ggGGn4uvFWAIelWD" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  },
  image: {
    type: "image",
    src: "/images/1.png",
    alt: "Add your alt text here",
  },
  infobar: {
    type: "infobar",
    title: "This is the main title",
    description: "This is an optional description",
  },
  infocards: {
    type: "infocards",
    variant: "top",
    title: "This is an optional title of the Infocards component",
    subtitle: "This is an optional subtitle for the Infocards component",
    cards: [
      {
        title: "This is the first card",
        url: "https://www.google.com",
        imageUrl: "https://placehold.co/200x200",
        imageAlt: "This is the alt text",
      },
      {
        title: "This is the second card",
        url: "https://www.google.com",
        imageUrl: "https://placehold.co/400x200",
        imageAlt: "This is the alt text",
      },
      {
        title: "This is the third card",
        url: "https://www.google.com",
        imageUrl: "https://placehold.co/500x200",
        imageAlt: "This is the alt text",
      },
    ],
  },
  infocols: {
    type: "infocols",
    title: "This is the main title of the InfoCols component",
    subtitle: "This is an optional subtitle for the InfoCols component.",
    infoBoxes: [
      {
        title: "This is the title of the first column",
        description: "You can also add additional description here",
        icon: "office-building",
      },
      {
        title: "This is the title of the second column",
        description: "You can also add additional description here",
        icon: "stars",
      },
      {
        title: "This is the title of the third column",
        description: "You can also add additional description here",
        icon: "globe",
      },
    ],
  },
  infopic: {
    type: "infopic",
    title: "This is an infopic",
    description: "This is the description for the infopic component",
    imageSrc: "https://placehold.co/600x400",
  },
  keystatistics: {
    type: "keystatistics",
    variant: "top",
    title: "Irrationality in numbers",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "3",
      },
      {
        label: "Growth in tasks assigned Q4 2024 (YoY)",
        value: "+12.2%",
      },
      {
        label: "Creative blocks met per single evening",
        value: "89",
      },
      {
        value: "4.0",
        label: "Number of lies in this stat block",
      },
    ],
  },
}
