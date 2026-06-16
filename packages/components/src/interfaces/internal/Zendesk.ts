import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

// Unlike askgov and vica, zendesk is a custom integration for a single site
// and should NOT be exposed as an editable option in apps/studio.
// format: "hidden" ensures the JSON Forms widget tester in studio does not pick this up.
export const ZendeskSchema = Type.Object(
  {
    widgetKey: Type.String({
      title: "Zendesk Widget Key",
      description:
        'This is the value of the "key" query parameter in the Zendesk Widget snippet URL (e.g. for src="https://static.zdassets.com/ekr/snippet.js?key=abc-123", the widget key is "abc-123").',
    }),
  },
  {
    title: "Zendesk Widget",
    description: "Schema for the Zendesk widget integration.",
    format: "hidden",
  },
)

export type ZendeskProps = Static<typeof ZendeskSchema>
export type ZendeskWidgetProps = ZendeskProps
