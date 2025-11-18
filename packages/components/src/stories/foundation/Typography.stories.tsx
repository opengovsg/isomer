import type { Meta, StoryObj } from "@storybook/react-vite"

import { withChromaticModes } from "@isomer/storybook-config"

const meta: Meta = {
  title: "Foundation/Typography",
  tags: ["!autodocs"],
  parameters: {
    chromatic: withChromaticModes(["desktop", "tablet", "mobile"]),
  },
}
export default meta
type Story = StoryObj<typeof meta>

export const Typography: Story = {
  render: () => {
    return (
      <div className="container flex max-w-screen-lg flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h1 className="prose-display-xl">Typography</h1>
          <div className="flex flex-col justify-between break-words rounded-lg bg-blue-700 px-4 py-8 text-white md:flex-row md:items-center md:px-12">
            <p className="prose-display-md">Inter</p>
            <div className="prose-headline-lg-regular flex flex-col">
              <span>ABCDEFGHIJKLMNOPQRSTUVWXYZ</span>
              <span>abcdefghijklmnopqrstuvwxyz</span>
              <span>1234567890?!()[]&#123;&#125;&*^%$#@~&lt;&gt;</span>
            </div>
          </div>
        </section>
        <section>
          <h2 className="prose-display-lg mb-4">Display</h2>
          <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2">
            <p className="prose-title-md-medium">Display XL</p>
            <p className="prose-display-xl">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Display LG</p>
            <p className="prose-display-lg">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Display MD</p>
            <p className="prose-display-md">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Display SM</p>
            <p className="prose-display-sm">
              The five boxing wizards jump quickly. 1234567890
            </p>
          </div>
        </section>
        <section>
          <h2 className="prose-display-lg mb-4">Title</h2>
          <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2">
            <p className="prose-title-md-medium">Title LG Medium</p>
            <p className="prose-title-lg-medium">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Title LG Regular</p>
            <p className="prose-title-lg-regular">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Title MD Semibold</p>
            <p className="prose-title-md-semibold">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Title MD Medium</p>
            <p className="prose-title-md-medium">
              The five boxing wizards jump quickly. 1234567890
            </p>
          </div>
        </section>
        <section>
          <h2 className="prose-display-lg mb-4">Headline</h2>
          <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2">
            <p className="prose-title-md-medium">Headline LG Semibold</p>
            <p className="prose-headline-lg-semibold">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Headline LG Medium</p>
            <p className="prose-headline-lg-medium">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Headline LG Regular</p>
            <p className="prose-headline-lg-regular">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Headline Base Semibold</p>
            <p className="prose-headline-base-semibold">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Headline Base Medium</p>
            <p className="prose-headline-base-medium">
              The five boxing wizards jump quickly. 1234567890
            </p>
          </div>
        </section>
        <section>
          <h2 className="prose-display-lg mb-4">Body</h2>
          <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2">
            <p className="prose-title-md-medium">Body Base</p>
            <p className="prose-body-base">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Body SM</p>
            <p className="prose-body-sm">
              The five boxing wizards jump quickly. 1234567890
            </p>
          </div>
        </section>
        <section>
          <h2 className="prose-display-lg mb-4">Label</h2>
          <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2">
            <p className="prose-title-md-medium">Label MD Medium</p>
            <p className="prose-label-md-medium">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Label MD Regular</p>
            <p className="prose-label-md-regular">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Label SM Medium</p>
            <p className="prose-label-sm-medium">
              The five boxing wizards jump quickly. 1234567890
            </p>
            <p className="prose-title-md-medium">Label SM Regular</p>
            <p className="prose-label-sm-regular">
              The five boxing wizards jump quickly. 1234567890
            </p>
          </div>
        </section>
      </div>
    )
  },
}
