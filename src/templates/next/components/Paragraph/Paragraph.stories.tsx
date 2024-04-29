import type { Meta, StoryFn } from "@storybook/react"
import type { ParagraphProps } from "~/interfaces"
import Paragraph from "./Paragraph"

export default {
  title: "Next/Components/Paragraph",
  component: Paragraph,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<ParagraphProps> = (args) => <Paragraph {...args} />

export const Default = Template.bind({})
Default.args = {
  content: `This is a paragraph of text. It can contain <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">external links</a> (and <a href="/contact">internal ones</a>), <code>code</code>, and line breaks. <br />
  We can also use <sub>subscript</sub> and <sup>superscript</sup> text.

  <p>This part is not on a new line because we do not allow paragraphs in paragraphs.</p><br />

  As usual, we can also use <b>bold</b>, <i>italic</i>, <u>underline</u>, and <s>strikethrough</s> text, but definitely not illegal content.

  <script>alert("This is a harmful script")</script>`,
}
