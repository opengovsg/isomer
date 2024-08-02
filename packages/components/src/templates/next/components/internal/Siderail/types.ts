import type { SetRequired } from "type-fest"

import type { SiderailProps } from "~/interfaces"

export type Item = SiderailProps["pages"][number]
export type ItemWithChild = SetRequired<Item, "childPages">
