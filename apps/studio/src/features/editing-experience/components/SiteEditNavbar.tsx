import Link from "next/link"
import { useParams } from "next/navigation"
import { BreadcrumbItem, BreadcrumbLink, Flex } from "@chakra-ui/react"
import { Breadcrumb } from "@opengovsg/design-system-react"

import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { useQueryParse } from "~/hooks/useQueryParse"
import { editPageSchema } from "../schema"
import PublishButton from "./PublishButton"

interface HidePublishButton {
  showPublish: false
}

interface ShowPublishButton {
  showPublish: true
  pageId: number
  siteId: number
}

type GetPublishButtonResult = HidePublishButton | ShowPublishButton
export const SiteEditNavbar = (): JSX.Element => {
  const pathParams = useParams()

  const getPublishButtonProps = (): GetPublishButtonResult => {
    const siteId = pathParams.siteId
    const pageId = pathParams.pageId

    // Ensure both siteId and pageId are strings and parseable as integers
    if (typeof siteId !== "string" || typeof pageId !== "string") {
      return { showPublish: false }
    }

    const parsedSiteId = parseInt(siteId, 10)
    const parsedPageId = parseInt(pageId, 10)

    // Check if both parsedSiteId and parsedPageId are valid numbers
    if (isNaN(parsedSiteId) || isNaN(parsedPageId)) {
      return { showPublish: false }
    }
    return { showPublish: true, siteId: parsedSiteId, pageId: parsedPageId }
  }

  const publishButtonProps = getPublishButtonProps()
  console.log(`publishButtonProps`, publishButtonProps)

  const { siteId } = useQueryParse(editPageSchema)
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
      >
        <Breadcrumb size="xs">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href={`/sites/${siteId}`}>
              All pages
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Current page</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {publishButtonProps.showPublish && (
          <Flex justifyContent={"end"} alignItems={"center"}>
            <PublishButton
              pageId={publishButtonProps.pageId}
              siteId={publishButtonProps.siteId}
            />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
