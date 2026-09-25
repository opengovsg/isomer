import type { IsomerComponent } from "@opengovsg/isomer-components"
import { HERO_ACTION_LAYOUT, HERO_STYLE } from "@opengovsg/isomer-components"
import {
  createDefaultHeroActionLayoutQuickActionItem,
  HERO_QUICK_ACTIONS_MIN_ITEMS,
} from "~/components/PageEditor/constants"

type QuickActionsGradientHero = Extract<
  IsomerComponent,
  { type: "hero"; variant: "gradient"; actionLayout: "quickActions" }
>

const isQuickActionsGradientHero = (
  component: IsomerComponent,
): component is QuickActionsGradientHero =>
  component.type === "hero" &&
  component.variant === HERO_STYLE.gradient &&
  component.actionLayout === HERO_ACTION_LAYOUT.quickActions

const isUnsetQuickActionItem = (item: unknown): boolean => {
  if (!item || typeof item !== "object") {
    return true
  }

  const { title, description, buttonLabel, buttonUrl, icon } = item as Record<
    string,
    unknown
  >

  return (
    title === undefined &&
    description === undefined &&
    buttonLabel === undefined &&
    buttonUrl === undefined &&
    icon === undefined
  )
}

/** Fills quick-action defaults JSON Forms will not create from the published schema. */
export const prepareHeroEditorData = (
  component: IsomerComponent,
): IsomerComponent => {
  if (!isQuickActionsGradientHero(component)) {
    return component
  }

  const existingItems = component.quickActionsItems ?? []
  const needsShowIcon = component.showIcon === undefined
  const quickActionsItems = existingItems.map((item) =>
    isUnsetQuickActionItem(item)
      ? createDefaultHeroActionLayoutQuickActionItem()
      : item,
  )

  while (quickActionsItems.length < HERO_QUICK_ACTIONS_MIN_ITEMS) {
    quickActionsItems.push(createDefaultHeroActionLayoutQuickActionItem())
  }

  const itemsChanged =
    quickActionsItems.length !== existingItems.length ||
    quickActionsItems.some((item, index) => item !== existingItems[index])

  if (!needsShowIcon && !itemsChanged) {
    return component
  }

  return {
    ...component,
    ...(needsShowIcon ? { showIcon: true } : {}),
    ...(itemsChanged ? { quickActionsItems } : {}),
  }
}
