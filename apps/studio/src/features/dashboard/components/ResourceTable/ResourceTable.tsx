import type { BaseResourceTableProps } from "../shared"
import { BaseResourceTable } from "../shared"
import { ResourceTableMenu } from "./ResourceTableMenu"

export const ResourceTable = ({
  siteId,
  resourceId,
}: Pick<BaseResourceTableProps, "siteId" | "resourceId">) => {
  return (
    <BaseResourceTable
      siteId={siteId}
      resourceId={resourceId}
      entityName="page"
      groupLabel="folder"
      renderMenu={(row) => (
        <ResourceTableMenu
          parentId={row.parentId}
          title={row.title}
          resourceId={row.id}
          type={row.type}
          permalink={row.permalink}
          resourceType={row.type}
        />
      )}
    />
  )
}
