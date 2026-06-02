import type { PropsWithChildren } from "react"
import type { BreadcrumbProps } from "~/interfaces"

import { Breadcrumb } from "../../components/internal/Breadcrumb"

interface CollectionPageHeaderProps extends PropsWithChildren {
  breadcrumb: BreadcrumbProps
  title: string
  subtitle: string
}

export const CollectionPageHeader = ({
  title,
  breadcrumb,
  subtitle,
  children,
}: CollectionPageHeaderProps) => {
  return (
    <div className="bg-brand-canvas text-base-content-strong">
      <div className="flex-col gap-8 mx-auto flex max-w-screen-xl px-6 py-8 md:px-10">
        <div className="flex-col flex">
          <Breadcrumb links={breadcrumb.links} />
          <div className="flex-col gap-5 mt-8 flex max-w-[54rem] md:mt-6">
            <h1 className="prose-display-lg break-words">{title}</h1>
            <p className="prose-title-lg-regular">{subtitle}</p>
          </div>
        </div>
        <div className="max-w-[54rem] pb-4">{children}</div>
      </div>
    </div>
  )
}
