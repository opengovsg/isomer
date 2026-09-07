/* oxlint-disable typescript/promise-function-async -- studio lint cleanup */
import type { ReactNode } from "react"
import type { ResourceType } from "~prisma/generated/generatedEnums"
import { PermissionsErrorBoundary } from "~/features/dashboard/PermissionsErrorPage"
import { Can, PermissionsProvider } from "~/features/permissions"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/schemas/sitePageSchema"
import { DefaultLayout } from "~/templates/layouts/DefaultLayout"

interface ErrorProps {
  title: string
  description: string
  buttonText: string
}

const ERROR_COMPONENT_PROPS = {
  Collection: {
    buttonText: "Back to My Sites",
    description:
      "To have access, ask your site admins to assign this collection to you",
    title: "You don't have access to edit this collection.",
  },
  CollectionLink: {
    buttonText: "Back to Site Content",
    description:
      "To have access, ask your site admins to assign this item to you",
    title: "You don't have access to edit this item.",
  },
  CollectionMeta: {
    buttonText: "Back to My Sites",
    description:
      "To have access, ask your site admins to assign this collection to you",
    title: "You don't have access to edit this collection.",
  },
  CollectionPage: {
    buttonText: "Back to Site Content",
    description:
      "To have access, ask your site admins to assign this page to you",
    title: "You don't have access to edit this page.",
  },
  Folder: {
    buttonText: "Back to My Sites",
    description:
      "To have access, ask your site admins to assign this folder to you",
    title: "You don't have access to edit this folder.",
  },
  FolderMeta: {
    buttonText: "Back to My Sites",
    description:
      "To have access, ask your site admins to assign this folder to you",
    title: "You don't have access to edit the page order of this folder.",
  },
  IndexPage: {
    buttonText: "Back to Site Content",
    description:
      "To have access, ask your site admins to assign this page to you",
    title: "You don't have access to edit this page.",
  },
  Page: {
    buttonText: "Back to Site Content",
    description:
      "To have access, ask your site admins to assign this page to you",
    title: "You don't have access to edit this page.",
  },
  RootPage: {
    buttonText: "Back to My Sites",
    description:
      "To have access, ask your site admins to add you as an editor. If they’ve already added you, you might need to refresh this page.",
    title: "You don't have access to edit this site.",
  },
} satisfies Record<ResourceType, ErrorProps>

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
        {({ isAllowed }) =>
          isAllowed ? (
            page
          ) : (
            <DefaultLayout>
              <PermissionsErrorBoundary
                {...ERROR_COMPONENT_PROPS[resourceType]}
              />
            </DefaultLayout>
          )
        }
      </Can>
    </PermissionsProvider>
  )
}
