import type { Meta, StoryObj } from "@storybook/react"

import type { OrderedListProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"
import OrderedList from "./OrderedList"

// Template for stories
const Template = (props: OrderedListProps) => (
  <>
    <p>This is a paragraph that is at the base</p>
    <OrderedList {...props} />
  </>
)

const meta: Meta<OrderedListProps> = {
  title: "Next/Components/OrderedList",
  component: OrderedList,
  render: Template,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof OrderedList>

export const Simple: Story = {
  args: {
    content: [
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 1" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 2" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 3" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: 'This is a long item <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">with links</a> and other <b>markup</b>',
              },
            ],
          },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 5" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Item 6 with line break<br />Item 6 continued",
              },
            ],
          },
        ],
      },
    ],
  },
}

export const Nested: Story = {
  args: {
    content: [
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 1" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 2" }] },
          {
            type: "orderedList",
            attrs: {
              start: 10,
            },
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Item 3" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Item 4" }],
                  },
                  {
                    type: "unorderedList",
                    content: [
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item 5" }],
                          },
                        ],
                      },
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item 6" }],
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
                    content: [{ type: "text", text: "Item 7" }],
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
          { type: "paragraph", content: [{ type: "text", text: "Item 8" }] },
        ],
      },
    ],
  },
}

export const NonStandardStart: Story = {
  args: {
    attrs: {
      start: 10,
    },
    content: [
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 1" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 2" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 3" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 4" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Item 5" }] },
        ],
      },
    ],
  },
}

export const LongParagraphs: Story = {
  args: {
    content: [
      {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu magna nulla. Nunc lacinia convallis eleifend. In pulvinar viverra nunc eget varius. Duis sed arcu sed nisi tincidunt ullamcorper ut at augue. Mauris ultricies orci non massa semper mattis. Quisque eget lorem tellus. Duis facilisis et metus tristique faucibus. Nunc ultricies mi ut erat porta, vehicula gravida lorem finibus. Praesent blandit rutrum scelerisque. Sed pellentesque elit id dui ornare ultricies. Nullam vestibulum ipsum vel lorem ultricies congue. Phasellus tempus metus ligula, ac tristique risus luctus a. Proin et diam id lorem efficitur semper. Aenean vulputate mauris nec ullamcorper volutpat. Mauris at lectus ut ante elementum vehicula vitae eu risus. Donec vulputate vitae lacus non tincidunt.",
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
            content: [
              {
                type: "text",
                text: "Nullam sodales massa id purus sagittis, et dignissim lorem sollicitudin. Curabitur gravida nisi pulvinar turpis rutrum molestie. Aenean nisl mauris, ullamcorper non maximus nec, posuere eu enim. Duis ut ex a quam sodales vestibulum. Duis sit amet tellus quam. Quisque vestibulum nunc nulla, eu ullamcorper diam accumsan ut. Donec rhoncus gravida fringilla.",
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
            content: [
              {
                type: "text",
                text: "Pellentesque eget tincidunt libero. Sed eget egestas tellus, sed ultrices lectus. Pellentesque nec urna erat. Mauris interdum lectus justo, vel aliquet arcu semper at. Nam interdum leo nisl, non convallis tellus blandit id. Integer luctus odio vitae mi varius, a cursus ante sollicitudin. Vestibulum sed lacus risus. Integer mollis feugiat quam, non convallis enim luctus ut. Phasellus euismod scelerisque nunc, sed sodales eros pulvinar hendrerit.",
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
            content: [
              {
                type: "text",
                text: "Phasellus ullamcorper auctor pharetra. Nam at lectus mattis, iaculis nisi et, malesuada arcu. Suspendisse quis odio eu massa varius placerat. Phasellus egestas sapien sit amet magna semper, ut egestas eros faucibus. Suspendisse interdum mi nec metus gravida pretium. Pellentesque rhoncus commodo tellus, non ultrices massa scelerisque eget. Phasellus id ante nisl. Praesent risus velit, vestibulum nec sodales nec, tempus nec nulla. Nunc vitae ultricies felis. Quisque id ipsum risus. In pretium purus ut accumsan efficitur. Quisque ut neque a nulla ultricies pretium. Aenean sed ipsum volutpat, elementum eros placerat, lacinia risus. Curabitur dapibus massa felis, et porta sapien congue ac. Aenean lorem enim, ultrices in velit nec, lacinia commodo orci.",
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
            content: [
              {
                type: "text",
                text: "Quisque scelerisque eros ut ante convallis scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Praesent molestie ullamcorper nunc vel accumsan. Etiam velit dolor, laoreet ut sollicitudin ac, consequat at massa. Ut eget eros a erat rutrum rutrum interdum in nulla. Cras magna sem, molestie et odio at, eleifend facilisis nisi. Cras blandit quis nibh eget ultricies. Sed viverra quam lorem, non maximus diam placerat eu. Integer pulvinar fringilla libero, sed placerat magna luctus a.",
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
            content: [
              {
                type: "text",
                text: "Nulla efficitur massa velit, at tincidunt dui aliquet vitae. Nam eget justo rutrum, sollicitudin tortor eu, tempus nisl. Aliquam maximus imperdiet erat non fermentum. Vestibulum malesuada tortor sollicitudin quam fermentum, sit amet laoreet nulla consectetur. Proin facilisis accumsan est, ut volutpat justo vestibulum eget. Nullam vel urna venenatis, tincidunt augue a, faucibus leo. Praesent sed lacus luctus, interdum ipsum vel, dictum est. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam gravida commodo imperdiet. Nam consectetur, purus et rhoncus interdum, nunc leo fringilla metus, quis venenatis massa neque eu purus. Vivamus elementum, dolor at vestibulum luctus, urna ante imperdiet lacus, in semper dolor mauris vitae mauris. Nam condimentum semper leo, ut bibendum dui pretium id. Nulla bibendum, risus ac aliquam porttitor, magna tortor varius est, sit amet malesuada mauris mi sit amet lorem. In id justo pellentesque, tempor massa in, tincidunt ex.",
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
            content: [
              {
                type: "text",
                text: "Cras sed pulvinar velit. Nunc ultricies, neque quis eleifend pellentesque, lacus est tempor sem, elementum vulputate sem ex sit amet quam. Nam ultricies felis quis magna congue facilisis. Nunc eget posuere orci, sed mattis neque. Aenean nec tempor arcu, vel mattis erat. Nullam fringilla ante ullamcorper, ultrices erat ut, ultricies velit. Fusce placerat quis massa eget gravida. Nunc feugiat dapibus elit, et aliquam dui. Phasellus tempus erat et nisi pulvinar, at luctus neque consectetur. Sed consequat lacus varius, pulvinar est ac, efficitur nunc. In hac habitasse platea dictumst. Donec gravida ex arcu, a faucibus velit sodales in. Nunc id lorem vel orci varius interdum. Nullam pulvinar nulla nec malesuada finibus.",
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
            content: [
              {
                type: "text",
                text: "Sed ac risus vitae mi sollicitudin finibus facilisis quis felis. Nullam turpis tortor, auctor nec volutpat viverra, fringilla eget est. Nunc tincidunt felis turpis, sit amet consectetur enim dignissim sit amet. Quisque rhoncus erat nec tristique cursus. Nulla nisl neque, interdum sed feugiat et, tristique non purus. Aliquam imperdiet neque at eros feugiat fringilla. Donec mattis eros vel velit dignissim tincidunt. Morbi leo ligula, consectetur ut volutpat ac, pharetra a nisl. Aenean ultrices tortor non egestas gravida. Integer quis bibendum ligula. Nulla pretium vehicula purus. Sed rutrum odio mi. Proin rhoncus nulla nisl, et lobortis purus sagittis ac. Aliquam mollis justo eu congue maximus. Proin ut ante cursus, pellentesque neque id, sollicitudin nunc. Cras sapien justo, faucibus vitae lacinia dignissim, interdum efficitur eros.",
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
            content: [
              {
                type: "text",
                text: "Ut in lorem ut velit lacinia gravida eu eget ipsum. Cras consectetur lobortis quam, vitae imperdiet urna scelerisque quis. Vivamus tincidunt eget turpis nec elementum. Nam facilisis viverra sapien, in commodo elit finibus eget. Sed molestie ut justo vel consectetur. Proin rutrum id sem ac lobortis. Quisque molestie pellentesque sapien ac ultricies. Nulla facilisi. Nam quam diam, molestie vel egestas quis, dictum nec leo. Mauris sit amet felis tristique, vestibulum eros sit amet, dignissim dui. Proin fringilla sollicitudin lacus, in tincidunt eros imperdiet et.",
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
            content: [
              {
                type: "text",
                text: "Donec non velit sed lectus pulvinar venenatis. Aliquam facilisis nec odio nec venenatis. Cras sit amet sollicitudin mi, sed tristique ipsum. Nulla vel massa tempor, faucibus dolor ultricies, pretium dui. Mauris ultricies augue augue, at tristique est elementum a. Etiam cursus velit quis dignissim dignissim. Nunc in aliquet neque. Phasellus vehicula sapien a eros mattis facilisis et a tellus. Nullam faucibus cursus ante. Aliquam tempor dolor a magna tristique, sodales viverra ante auctor. Proin tempor arcu quis purus interdum, in rhoncus tellus euismod. Phasellus et consequat elit. Duis non ligula at tellus sagittis faucibus vitae at arcu.",
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
            content: [
              {
                type: "text",
                text: "Maecenas mi metus, dapibus eu diam non, pretium tincidunt erat. Morbi placerat molestie elit nec pharetra. Vivamus lacinia orci pretium massa hendrerit sodales. Sed at magna ex. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec vitae ligula nec leo pulvinar ornare. Nam eu velit est. Fusce dapibus risus congue, efficitur sapien eu, porta neque. Etiam ultricies ipsum et nulla varius, non consequat nisi gravida. Nam mattis pretium risus quis blandit. Curabitur vel magna eu velit interdum facilisis.",
              },
            ],
          },
        ],
      },
    ],
  },
}
