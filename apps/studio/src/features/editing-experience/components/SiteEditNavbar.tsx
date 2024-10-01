import Link from "next/link"
import { useRouter } from "next/router"
import {
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { Breadcrumb } from "@opengovsg/design-system-react"

import { TabLink } from "~/components/TabLink"
import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { useQueryParse } from "~/hooks/useQueryParse"
import { getResourceSubpath } from "~/utils/resource"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import PublishButton from "./PublishButton"

interface NavigationBreadcrumbsProps {
  siteId: string
  pageId: string
}

const NavigationBreadcrumbs = ({
  siteId,
  pageId,
}: NavigationBreadcrumbsProps): JSX.Element => {
  const { data: resource, isLoading: isResourceLoading } =
    trpc.resource.getMetadataById.useQuery({
      resourceId: pageId,
    })

  const { data: parentResource, isLoading: isParentResourceLoading } =
    trpc.resource.getMetadataById.useQuery(
      {
        resourceId: resource?.parentId ?? "",
      },
      { enabled: !!resource?.parentId },
    )

  const isBreadcrumbLoaded =
    (!resource?.parentId || !isParentResourceLoading) && !isResourceLoading

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

export const SiteEditNavbar = (): JSX.Element => {
  const { siteId, pageId } = useQueryParse(editPageSchema)

  const { pathname } = useRouter()

  return (
    <Flex flex="0 0 auto" gridColumn="1/-1">
      <Flex
        h={ADMIN_NAVBAR_HEIGHT}
        pos="fixed"
        zIndex="docked"
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
        <NavigationBreadcrumbs
          siteId={String(siteId)}
          pageId={String(pageId)}
        />

        <Flex gap="2rem">
          <TabLink
            isActive={pathname === "/sites/[siteId]/pages/[pageId]"}
            href={`/sites/${siteId}/pages/${pageId}`}
          >
            Edit
          </TabLink>
          <TabLink
            isActive={pathname === "/sites/[siteId]/pages/[pageId]/settings"}
            href={`/sites/${siteId}/pages/${pageId}/settings`}
          >
            Page Settings
          </TabLink>
        </Flex>
        {pageId && siteId && (
          <Flex justifyContent={"end"} alignItems={"center"} flex={1}>
            <PublishButton pageId={pageId} siteId={siteId} />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
