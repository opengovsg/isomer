import { Meta, StoryFn } from '@storybook/react'

import { Infopic, InfopicProps } from './Infopic'

export default {
  title: 'Components/Infopic',
  component: Infopic,
  tags: ['autodocs'],
} as Meta

const InfopicTemplate: StoryFn<InfopicProps> = (args) => <Infopic {...args} />


export const Default = InfopicTemplate.bind({})
Default.args = {
  title: 'test'
}