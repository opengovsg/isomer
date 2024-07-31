"use client"

import { useMemo } from "react"
import { tv } from "tailwind-variants"

import type { Item } from "./types"
import type { SiderailProps } from "~/interfaces"
import { SiderailProvider } from "./SiderailContext"
import { SiderailLabel } from "./SiderailLabel"
import { SiderailList } from "./SiderailList"
import { SiderailParentLabel } from "./SiderailParentLabel"
import { isNestableItem } from "./utils"

const createSiderailStyles = tv({
  base: "flex flex-col border-b border-b-divider-subtle last:border-b-transparent",
})

// Generate recursive sidebar items if nested
const generateSiderailItems = (items: Item[]): JSX.Element[] => {
  const styles = createSiderailStyles()
  return items.map((item, index) => {
    if (isNestableItem(item)) {
      return (
        <SiderailList key={index} item={item} className={styles}>
          {generateSiderailItems(item.childPages)}
        </SiderailList>
      )
    }
    // No children
    return (
      <li>
        <SiderailLabel key={index} {...item} className={styles} />
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
          <li>
            <SiderailParentLabel
              parentTitle={parentTitle}
              parentUrl={parentUrl}
            />
          </li>
          {siderailItems}
        </ul>
      </SiderailProvider>
    </nav>
  )
}
