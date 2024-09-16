import Link from "next/link"
import {
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Skeleton,
  TabList,
  Text,
} from "@chakra-ui/react"
import { Breadcrumb, Tab } from "@opengovsg/design-system-react"

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
            <Text textStyle="subhead-2" noOfLines={1} maxW="12rem">
              {parentResource.title}
            </Text>
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}

      {!!resource && (
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">
            <Text textStyle="subhead-2" noOfLines={1} maxW="12rem">
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

        <TabList>
          <Tab>Edit</Tab>
          <Tab>Page Settings</Tab>
        </TabList>
        {pageId && siteId && (
          <Flex justifyContent={"end"} alignItems={"center"} flex={1}>
            <PublishButton pageId={pageId} siteId={siteId} />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
