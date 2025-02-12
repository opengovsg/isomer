import type { BaseResourceTableProps } from "../shared"
import { BaseResourceTable } from "../shared"
import { CollectionTableMenu } from "./CollectionTableMenu"

export const CollectionTable = ({
  siteId,
  resourceId,
}: Pick<BaseResourceTableProps, "siteId" | "resourceId">) => {
  return (
    <BaseResourceTable
      siteId={siteId}
      resourceId={resourceId}
      entityName="collection page"
      groupLabel="collection"
      renderMenu={(row) => (
        <CollectionTableMenu
          resourceType={row.type}
          title={row.title}
          resourceId={row.id}
        />
      )}
    />
  )
}
