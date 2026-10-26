import type {
  ArrayLayoutProps,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import type { HeroGradientQuickActionsProps } from "@opengovsg/isomer-components"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { HERO_QUICK_ACTIONS_FORMAT } from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { createDefaultHeroGradientQuickActionsItem } from "../../utils/defaultHeroGradientQuickActionsItem"
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

export const jsonFormsHeroQuickActionsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroQuickActionsControl,
  schemaMatches((schema) => schema.format === HERO_QUICK_ACTIONS_FORMAT),
)

function JsonFormsHeroQuickActionsControl(props: ArrayLayoutProps) {
  const ctx = useJsonForms()
  const showIcon =
    (ctx.core?.data as Partial<HeroGradientQuickActionsProps> | undefined)
      ?.actions?.showIcon ?? true

  return (
    <JsonFormsArrayControl
      {...props}
      createItem={createDefaultHeroGradientQuickActionsItem}
      childLabelProp="title"
      mapDrawerUiSchema={showIcon ? undefined : omitIconField}
    />
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsHeroQuickActionsControl)
