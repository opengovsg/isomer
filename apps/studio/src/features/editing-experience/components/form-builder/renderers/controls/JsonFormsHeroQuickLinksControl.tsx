import type {
  ArrayLayoutProps,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import type { HeroGradientQuickLinksProps } from "@opengovsg/isomer-components"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { HERO_QUICK_LINKS_FORMAT } from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { createDefaultHeroGradientQuickLinksItem } from "../../utils/defaultHeroGradientQuickLinksItem"
import { JsonFormsArrayControl } from "./JsonFormsArrayControl"

const omitIconField = (uischema: UISchemaElement): UISchemaElement =>
  "elements" in uischema && Array.isArray(uischema.elements)
    ? {
        ...uischema,
        elements: uischema.elements.filter(
          (element: UISchemaElement & { scope?: string }) =>
            element.scope !== "#/properties/icon",
        ),
      }
    : uischema

export const jsonFormsHeroQuickLinksControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroQuickLinksControl,
  schemaMatches((schema) => schema.format === HERO_QUICK_LINKS_FORMAT),
)

function JsonFormsHeroQuickLinksControl(props: ArrayLayoutProps) {
  const ctx = useJsonForms()
  const showIcon =
    (ctx.core?.data as Partial<HeroGradientQuickLinksProps> | undefined)
      ?.actions?.showIcon ?? true

  return (
    <JsonFormsArrayControl
      {...props}
      createItem={createDefaultHeroGradientQuickLinksItem}
      childLabelProp="title"
      mapDrawerUiSchema={showIcon ? undefined : omitIconField}
    />
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsHeroQuickLinksControl)
