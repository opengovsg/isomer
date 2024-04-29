import type { Meta, StoryFn } from "@storybook/react"
import type { NavbarProps } from "~/interfaces"
import Navbar from "./Navbar"

export default {
  title: "Next/Components/Navbar",
  component: Navbar,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<NavbarProps> = (args) => <Navbar {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  type: "navbar",
  logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
  logoAlt: "Isomer logo",
  search: {
    type: "localSearch",
    searchUrl: "/search",
  },
  items: [
    {
      name: "Expandable nav item",
      url: "/item-one",
      items: [
        {
          name: "PA's network one",
          url: "/item-one/pa-network-one",
          description: "Click here and brace yourself for mild disappointment.",
        },
        {
          name: "PA's network two",
          url: "/item-one/pa-network-two",
          description: "Click here and brace yourself for mild disappointment.",
        },
        {
          name: "PA's network three",
          url: "/item-one/pa-network-three",
        },
        {
          name: "PA's network four",
          url: "/item-one/pa-network-four",
          description:
            "Click here and brace yourself for mild disappointment. This one has a pretty long one",
        },
        {
          name: "PA's network five",
          url: "/item-one/pa-network-five",
          description:
            "Click here and brace yourself for mild disappointment. This one has a pretty long one",
        },
        {
          name: "PA's network six",
          url: "/item-one/pa-network-six",
          description: "Click here and brace yourself for mild disappointment.",
        },
      ],
    },
    {
      name: "Expandable nav item",
      url: "/item-two",
      description: "This is a description of the item.",
      items: [
        {
          name: "A sub item",
          url: "/item-two/sub-item",
          description: "Click here and brace yourself for mild disappointment.",
        },
        {
          name: "Another sub item",
          url: "/item-two/another-sub-item",
        },
      ],
    },
    {
      name: "Expandable nav item",
      url: "/item-three",
      items: [
        {
          name: "A sub item",
          url: "/item-three/sub-item",
        },
        {
          name: "Another sub item",
          url: "/item-three/another-sub-item",
          description: "Click here and brace yourself for mild disappointment.",
        },
      ],
    },
    {
      name: "Single item",
      url: "/single-item",
    },
    {
      name: "Expandable nav item",
      url: "/item-five",
      items: [
        {
          name: "A sub item",
          url: "/item-five/sub-item",
        },
        {
          name: "Another sub item",
          url: "/item-five/another-sub-item",
        },
      ],
    },
  ],
}
