/* oxlint-disable import/no-cycle, unicorn/no-unnecessary-type-conversion -- core cleanup deferred */
import {
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { Breadcrumb } from "@opengovsg/design-system-react"
import Link from "next/link"
import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { useQueryParse } from "~/hooks/useQueryParse"
import { editLinkPageSchema } from "~/pages/sites/[siteId]/links/[linkId]/editLinkPageSchema"
import { getResourceSubpath } from "~/utils/resource"
import { trpc } from "~/utils/trpc"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import PublishButton from "./PublishButton"

interface NavigationBreadcrumbsProps {
  siteId: string
  pageId: string
}

const NavigationBreadcrumbs = ({
  siteId,
  pageId,
}: NavigationBreadcrumbsProps): React.ReactNode => {
  const { data: resource, isLoading: isResourceLoading } =
    trpc.resource.getMetadataById.useQuery({
      resourceId: pageId,
      siteId: Number(siteId),
    })

  const { data: parentResource, isLoading: isParentResourceLoading } =
    trpc.resource.getMetadataById.useQuery(
      {
        resourceId: resource?.parentId ?? "",
        siteId: Number(siteId),
      },
      { enabled: !!hasNonEmptyString(resource?.parentId) },
    )

  const isBreadcrumbLoaded =
    (!hasNonEmptyString(resource?.parentId) || !isParentResourceLoading) &&
    !isResourceLoading

  return (
    <Breadcrumb size="sm" flex={1}>
      <BreadcrumbItem>
        <BreadcrumbLink as={Link} href={`/sites/${siteId}`}>
          <Text textStyle="subhead-2">All pages</Text>
        </BreadcrumbLink>
      </BreadcrumbItem>

      {!isBreadcrumbLoaded && (
        <BreadcrumbItem>
          <Skeleton height="1.25rem" width="16rem" />
        </BreadcrumbItem>
      )}

      {!!parentResource && (
        <BreadcrumbItem>
          <BreadcrumbLink
            as={Link}
            href={`/sites/${siteId}/${getResourceSubpath(parentResource.type)}/${parentResource.id}`}
          >
            <Text
              textStyle="subhead-2"
              noOfLines={1}
              maxW="12rem"
              wordBreak="break-all"
            >
              {parentResource.title}
            </Text>
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}

      {!!resource && (
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">
            <Text
              wordBreak="break-all"
              textStyle="subhead-2"
              noOfLines={1}
              maxW="12rem"
            >
              {resource.title}
            </Text>
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}
    </Breadcrumb>
  )
}

export const LinkEditNavbar = (): React.ReactNode => {
  const { linkId, siteId } = useQueryParse(editLinkPageSchema)

  return (
    <Flex
      h={ADMIN_NAVBAR_HEIGHT}
      w="100%"
      justify="space-between"
      align="center"
      px={{ base: "1.5rem", md: "1.8rem", xl: "2rem" }}
      pl={{ base: `calc(1rem + ${ADMIN_NAVBAR_HEIGHT})`, sm: "1.5rem" }}
      py="0.375rem"
      bg="white"
      borderBottomWidth="1px"
      borderColor="base.divider.medium"
      transition="padding 0.1s"
      gap="0.5rem"
    >
      <NavigationBreadcrumbs siteId={String(siteId)} pageId={String(linkId)} />

      {linkId && siteId && (
        <Flex justifyContent="end" alignItems="center" flex={1}>
          <PublishButton pageId={linkId} siteId={siteId} />
        </Flex>
      )}
    </Flex>
  )
}
