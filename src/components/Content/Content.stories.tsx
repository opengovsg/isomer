import React from "react"
import { Story, Meta } from "@storybook/react"

import Content, { ContentProps } from "./Content"

export default {
  title: "Isomer/Content",
  component: Content,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<ContentProps> = (args) => <Content {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  markdown: `# h1 Heading 8-)
  ## h2 Heading
  ### h3 Heading
  #### h4 Heading
  ##### h5 Heading
  ###### h6 Heading
  
  
  ## Horizontal Rules
  
  ___
  
  ---
  
  ***
  
  
  ## Typographic replacements
  
  Enable typographer option to see result.
  
  (c) (C) (r) (R) (tm) (TM) (p) (P) +-
  
  test.. test... test..... test?..... test!....
  
  !!!!!! ???? ,,  -- ---
  
  "Smartypants, double quotes" and 'single quotes'
  
  
  ## Emphasis
  
  **This is bold text**
  
  __This is bold text__
  
  *This is italic text*
  
  _This is italic text_
  
  ~~Strikethrough~~
  
  
  ## Blockquotes
  
  
  > Blockquotes can also be nested...
  >> ...by using additional greater-than signs right next to each other...
  > > > ...or with spaces between arrows.
  
  
  ## Lists
  
  Unordered
  
  + Create a list by starting a line with \`+\`, \`-\`, or \`*\`
  + Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
      * Ac tristique libero volutpat at
      + Facilisis in pretium nisl aliquet
      - Nulla volutpat aliquam velit
  + Very easy!
  
  Ordered
  
  1. Lorem ipsum dolor sit amet
  2. Consectetur adipiscing elit
  3. Integer molestie lorem at massa
  
  
  1. You can use sequential numbers...
  1. ...or keep all the numbers as \`1.\`
  
  Start numbering with offset:
  
  57. foo
  1. bar`,
}

// Custom scenario
export const CustomContent = Template.bind({})
CustomContent.args = {
  markdown: ``,
}
