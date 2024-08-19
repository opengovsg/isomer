import type { PropsWithChildren } from "react"

import type { BreadcrumbProps } from "~/interfaces"
import { Breadcrumb } from "../../components/internal"

interface CollectionPageHeaderProps extends PropsWithChildren {
  breadcrumb: BreadcrumbProps
  title: string
  subtitle: string
  LinkComponent?: any
}

const CollectionPageHeader = ({
  title,
  breadcrumb,
  subtitle,
  LinkComponent,
  children,
}: CollectionPageHeaderProps) => {
  return (
    <div className="bg-brand-canvas text-base-content-strong">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-6 py-8 md:px-10">
        <div className="flex flex-col">
          <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
          <div className="mt-8 flex max-w-[54rem] flex-col gap-5 md:mt-6">
            <h1 className="prose-display-lg">{title}</h1>
            <p className="prose-title-lg-regular">{subtitle}</p>
          </div>
        </div>
        <div className="max-w-[54rem]">{children}</div>
      </div>
    </div>
  )
}

export default CollectionPageHeader
