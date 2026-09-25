import type { IsomerComponent } from "@opengovsg/isomer-components"
import {
  HERO_ACTION_LAYOUT,
  HERO_STYLE,
} from "@opengovsg/isomer-components"

import {
  createDefaultHeroActionLayoutQuickActionItem,
  HERO_QUICK_ACTIONS_DEFAULT_TITLE,
  HERO_QUICK_ACTIONS_MIN_ITEMS,
} from "./heroQuickActionDefaults"

/** Ensures min quick-action items when gradient hero uses the quick-actions action layout. */
export const ensureHeroActionLayoutQuickActionsItems = (
  component: IsomerComponent,
): IsomerComponent => {
  if (component.type !== "hero") {
    return component
  }

  if (component.variant !== HERO_STYLE.gradient) {
    return component
  }

  if (component.actionLayout !== HERO_ACTION_LAYOUT.quickActions) {
    return component
  }

  const existingItems = component.quickActionsItems ?? []
  const needsItems = existingItems.length < HERO_QUICK_ACTIONS_MIN_ITEMS
  const needsTitle = !component.quickActionsTitle?.trim()

  if (!needsItems && !needsTitle) {
    return component
  }

  let next = component

  if (needsItems) {
    const quickActionsItems = [...existingItems]
    while (quickActionsItems.length < HERO_QUICK_ACTIONS_MIN_ITEMS) {
      quickActionsItems.push(createDefaultHeroActionLayoutQuickActionItem())
    }
    next = { ...next, quickActionsItems }
  }

  if (needsTitle) {
    next = { ...next, quickActionsTitle: HERO_QUICK_ACTIONS_DEFAULT_TITLE }
  }

  return next
}
