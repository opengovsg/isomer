import type { Meta, StoryObj } from "@storybook/react-vite"
import { encode } from "js-base64"

import Content from "./Content"

const meta: Meta<typeof Content> = {
  title: "Classic/Components/Content",
  component: Content,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}

export default meta
type Story = StoryObj<typeof Content>

// Default scenario
export const Default: Story = {
  args: {
    markdown: encode(`# h1 Heading 8-)
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
  1. bar`),
  },
}

// Custom scenario
export const CustomContent: Story = {
  args: {
    markdown:
      "IyBXaG8gdXNlcyBJc29tZXI/Cgo+IElzb21lciBob3N0cyB3ZWJzaXRlcyBmb3IgNzArIGdvdmVybm1lbnQgYWdlbmNpZXMsIG1pbmlzdHJpZXMsIHN0YXRib2FyZHMsIGFuZCBzY2hvb2xzCgohW0xvZ28gd2FsbCBvZiBJc29tZXIgdXNlcnMgc3VjaCBhcyBPR1AsIE1MYXcgYW5kIEJPQV0oaHR0cHM6Ly93d3cuaXNvbWVyLmdvdi5zZy9pbWFnZXMvb3VyJTIwdXNlcnNfYWdlbmN5JTIwbG9nb3MucG5nKQoKIyMjIyBDaGVjayBvdXQgdGhlc2Ugc2l0ZXMgZnJvbSBvdXIgdXNlcnM6CgotIFtsZWVrdWFueWV3d29ybGRjaXR5cHJpemUuZ292LnNnXShodHRwczovL3d3dy5sZWVrdWFueWV3d29ybGRjaXR5cHJpemUuZ292LnNnLykKLSBbc3dpdGNoc2cub3JnXShodHRwczovL3d3dy5zd2l0Y2hzZy5vcmcvKQotIFtvdXJmb29kZnV0dXJlLmdvdi5zZ10oaHR0cHM6Ly93d3cub3VyZm9vZGZ1dHVyZS5nb3Yuc2cvKQotIFtub3J0aGVhc3QuY2RjLmdvdi5zZ10oaHR0cHM6Ly9ub3J0aGVhc3QuY2RjLmdvdi5zZy8pCi0gW3NtYXJ0bmF0aW9uLmdvdi5zZ10oaHR0cHM6Ly93d3cuc21hcnRuYXRpb24uZ292LnNnLykKCiMjIyBJc29tZXIgaW4gYWN0aW9uIOKAkyBjb3ZpZC5nb3Yuc2cKCkR1cmluZyB0aGUgT21pY3JvbiB3YXZlIG9mIENPVklELTE5IGluIFNpbmdhcG9yZSwgSXNvbWVyIHdhcyB1c2VkIHRvIHF1aWNrbHkgc2V0IHVwIF9jb3ZpZC5nb3Yuc2dfLiBJdCdzIGEgbWljcm9zaXRlIHRoYXQgcHJvdmlkZXMgaW5mb3JtYXRpb24gb24gaGVhbHRoIHByb3RvY29scyBhbmQgbmV4dCBzdGVwcy4KCioqVGhlIHNpdGUgd2FzIHNldCB1cCwgcG9wdWxhdGVkLCBhbmQgbGF1bmNoZWQgd2l0aGluIGp1c3QgNCBkYXlzLioqIEl0IGZlYXR1cmVkIENoZWNrRmlyc3QgY2hlY2tlcnMgdGhhdCB2aXNpdG9ycyBjb3VsZCBmaWxsIG91dC4gQmFzZWQgb24gdGhlaXIgc2l0dWF0aW9uLCB0aGV5IHdvdWxkIGJlIHJlZGlyZWN0ZWQgdG8gcGFnZXMgd2l0aCB0aGUgYXBwcm9wcmlhdGUgcHJvdG9jb2wgdG8gZm9sbG93LiBUaGUgc2l0ZSBhbHNvIGZlYXR1cmVkIGxpbmtzIHRvIGFuIEFza0dvdiBGQVEgZm9yIGZ1cnRoZXIgaW5mb3JtYXRpb24uIFRoaXMgZW1wb3dlcmVkIHNpdGUgdmlzaXRvcnMgdG8gc2VsZi1zZXJ2ZSBjb21wbGV4IGluZm9ybWF0aW9uLgoKVGhlIHdlYnNpdGUgaGFkIDEgbWlsbGlvbiB2aXNpdG9ycyBpbiBpdHMgZmlyc3QgbW9udGggYW5kIHdhcyBmZWF0dXJlZCBvbiBwcmludCBhbmQgZGlnaXRhbCBtZWRpYS4gSXQgcmVjZWl2ZWQgZ29vZCBmZWVkYmFjayBmb3IgYmVpbmcgKipmYXN0IHdpdGggdXBkYXRlcyBvbiBjaGFuZ2luZyBwcm90b2NvbHMsIGVhc3kgdG8gdXNlLCBhbmQgaGVscGZ1bCBmb3IgZmluZGluZyBpbXBvcnRhbnQgaW5mb3JtYXRpb24uKioKCklzb21lciB3YXMgYWxzbyB1c2VkIHRvIGJ1aWxkIHdlYnNpdGVzIGZvciBvdGhlciBDT1ZJRC0xOSBjYW1wYWlnbnMsIHN1Y2ggYXMgX3NndW5pdGVkLmdvdi5zZ18gYW5kIF9zYWZldHJhdmVsLmljYS5nb3Yuc2dfLiAqKkluc3RlYWQgb2Ygd2FpdGluZyBtb250aHMgZm9yIHByb2N1cmVtZW50LCBJc29tZXIgZW5hYmxlZCBhZ2VuY2llcyB0byBidWlsZCB0aGVzZSB3ZWJzaXRlcyBpbiBhcyBsaXR0bGUgYXMgMS41IGRheXMsKiogZW5zdXJpbmcgdGhhdCBjaXRpemVucyByZWNlaXZlZCB0aGUgbGF0ZXN0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb25zdGFudGx5IGV2b2x2aW5nIENPVklELTE5IHNpdHVhdGlvbi4KCl9jb3ZpZC5nb3Yuc2cgd2FzIGxpdmUgZnJvbSAxIE9jdCAyMDIxLCB0byAxMyBGZWIgMjAyM18KCiFbQSBzY3JlZW5zaG90IG9mIHRoZSBjb3ZpZC5nb3Yuc2cgbGFuZGluZyBwYWdlXShodHRwczovL3d3dy5pc29tZXIuZ292LnNnL2ltYWdlcy9Db3ZpZEdvdlNHL2NvdmlkZ292c2dfMS5wbmcpCgohW0Egc2NyZWVuc2hvdCBvZiBhIGNoZWNrZmlyc3QgY2hlY2tlciBlbWJlZGRlZCBvbiBjb3ZpZC5nb3Yuc2cgXShodHRwczovL3d3dy5pc29tZXIuZ292LnNnL2ltYWdlcy9Db3ZpZEdvdlNHL2NvdmlkZ292c2dfMi5wbmcpCgohW0Egc2NyZWVuc2hvdCBvZiB0aGUgcGFnZSBvbiBFbGlnaWJpbGl0eSBmb3IgdGhlIGhvbWUgcmVjb3ZlcnkgcHJvZ3JhbW1lXShodHRwczovL3d3dy5pc29tZXIuZ292LnNnL2ltYWdlcy9Db3ZpZEdvdlNHL2NvdmlkZ292c2dfMy5wbmcpCg==",
  },
}
