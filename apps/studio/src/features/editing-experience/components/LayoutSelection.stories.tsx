import React from 'react'
import { Meta, StoryFn } from '@storybook/react'
import type { LayoutSelectionProps } from './LayoutSelection'
import LayoutSelection from './LayoutSelection'

export default {
  title: 'Components/LayoutSelection',
  component: LayoutSelection,
  argTypes: {},
  parameters: {},
} as Meta

// Template for stories
const Template: StoryFn<LayoutSelectionProps> = (args) => (
  <LayoutSelection {...args} />
)

// Default scenario
export const Default = Template.bind({})
Default.args = {
  pageName: 'Sample Page',
  pageUrl: '/sample-page',
  siteId: '1',
  folderId: '1',
}
