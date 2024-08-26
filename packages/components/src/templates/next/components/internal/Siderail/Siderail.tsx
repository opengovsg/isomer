"use client"

import { useMemo } from "react"

import type { Item } from "./types"
import type { SiderailProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { SiderailProvider } from "./SiderailContext"
import { SiderailLabel } from "./SiderailLabel"
import { SiderailList } from "./SiderailList"
import { SiderailParentLabel } from "./SiderailParentLabel"
import { isNestableItem } from "./utils"

const createSiderailStyles = tv({
  slots: {
    container: "border-b border-b-divider-subtle last:border-b-transparent",
    label: "flex flex-col",
  },
})

const compoundStyles = createSiderailStyles()

// Generate recursive sidebar items if nested
const generateSiderailItems = (items: Item[]): JSX.Element[] => {
  return items.map((item, index) => {
    if (isNestableItem(item)) {
      return (
        <SiderailList
          key={index}
          item={item}
          className={compoundStyles.container()}
        >
          {generateSiderailItems(item.childPages)}
        </SiderailList>
      )
    }
    // No children
    return (
      <li key={index} className={compoundStyles.container()}>
        <SiderailLabel
          key={index}
          {...item}
          className={compoundStyles.label()}
        />
      </li>
    )
  })
}

export const Siderail = ({
  parentTitle,
  parentUrl,
  pages,
  LinkComponent = "a",
}: SiderailProps): JSX.Element => {
  const siderailItems = useMemo(() => generateSiderailItems(pages), [pages])

  return (
    <nav className="text-base-content" role="navigation">
      <h2 className="sr-only">Pages in this section</h2>
      <SiderailProvider LinkComponent={LinkComponent}>
        <ul>
          <SiderailParentLabel
            parentTitle={parentTitle}
            parentUrl={parentUrl}
          />
          {siderailItems}
        </ul>
      </SiderailProvider>
    </nav>
  )
}
