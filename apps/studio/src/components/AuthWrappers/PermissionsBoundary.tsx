import type { ReactNode } from "react"

import type { ResourceType } from "~prisma/generated/generatedEnums"
import { PermissionsErrorBoundary } from "~/features/dashboard/PermissionsErrorPage"
import { Can, PermissionsProvider } from "~/features/permissions"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { DefaultLayout } from "~/templates/layouts/DefaultLayout"

interface ErrorProps {
  title: string
  description: string
  buttonText: string
}

const ERROR_COMPONENT_PROPS: Record<ResourceType, ErrorProps> = {
  Collection: {
    title: "You don't have access to edit this collection.",
    description:
      "To have access, ask your site admins to assign this collection to you",
    buttonText: "Back to My Sites",
  },
  CollectionMeta: {
    title: "You don't have access to edit this collection.",
    description:
      "To have access, ask your site admins to assign this collection to you",
    buttonText: "Back to My Sites",
  },
  IndexPage: {
    title: "You don't have access to edit this page.",
    description:
      "To have access, ask your site admins to assign this page to you",
    buttonText: "Back to Site Content",
  },
  Page: {
    title: "You don't have access to edit this page.",
    description:
      "To have access, ask your site admins to assign this page to you",
    buttonText: "Back to Site Content",
  },
  CollectionLink: {
    title: "You don't have access to edit this item.",
    description:
      "To have access, ask your site admins to assign this item to you",
    buttonText: "Back to Site Content",
  },
  CollectionPage: {
    title: "You don't have access to edit this page.",
    description:
      "To have access, ask your site admins to assign this page to you",
    buttonText: "Back to Site Content",
  },
  RootPage: {
    title: "You don't have access to edit this site.",
    description:
      "To have access, ask your site admins to add you as an editor. If they’ve already added you, you might need to refresh this page.",
    buttonText: "Back to My Sites",
  },
  Folder: {
    title: "You don't have access to edit this folder.",
    description:
      "To have access, ask your site admins to assign this folder to you",
    buttonText: "Back to My Sites",
  },
  FolderMeta: {
    title: "You don't have access to edit the page order of this folder.",
    description:
      "To have access, ask your site admins to assign this folder to you",
    buttonText: "Back to My Sites",
  },
} as const

interface PermissionsBoundaryProps {
  resourceType: ResourceType
  page: ReactNode
}
export const PermissionsBoundary = ({
  resourceType,
  page,
}: PermissionsBoundaryProps) => {
  const { siteId } = useQueryParse(sitePageSchema)
  return (
    <PermissionsProvider siteId={siteId}>
      <Can do="read" on={{ parentId: null }} passThrough>
        {(allowed) => {
          return allowed ? (
            page
          ) : (
            <DefaultLayout>
              <PermissionsErrorBoundary
                {...ERROR_COMPONENT_PROPS[resourceType]}
              />
            </DefaultLayout>
          )
        }}
      </Can>
    </PermissionsProvider>
  )
}
