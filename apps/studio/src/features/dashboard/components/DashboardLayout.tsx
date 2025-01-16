import type { ReactNode } from "react"
import NextLink from "next/link"
import {
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Breadcrumb } from "@opengovsg/design-system-react"

export const DashboardLayout = ({
  breadcrumbs,
  icon,
  title,
  buttons,
  preTableContent,
  children,
}: {
  breadcrumbs: {
    href: string
    label: string
  }[]
  icon: ReactNode
  title: string
  buttons: ReactNode
  preTableContent?: ReactNode
  children: ReactNode
}) => {
  const allBreadcrumbsExceptLast = breadcrumbs.slice(0, -1)
  const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1]
  return (
    <VStack
      w="100%"
      p="1.75rem"
      gap="1rem"
      height="0"
      overflow="auto"
      minH="100%"
    >
      <VStack w="100%" align="start">
        <Breadcrumb
          size="sm"
          w="100%"
          minH="1.25rem" // maintain height even when single breadcrumb
          display="flex"
          alignItems="center"
        >
          {allBreadcrumbsExceptLast.map(({ href, label }, index) => {
            return (
              <BreadcrumbItem key={index}>
                <BreadcrumbLink href={href} as={NextLink}>
                  <Text
                    textStyle="caption-2"
                    color="interaction.links.default"
                    noOfLines={1}
                    w="max-content"
                  >
                    {label}
                  </Text>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )
          })}
          <BreadcrumbItem
            key={lastBreadcrumb?.href}
            overflow="hidden"
            whiteSpace="nowrap"
          >
            <Text
              textStyle="caption-2"
              color="base.content.default"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {lastBreadcrumb?.label}
            </Text>
          </BreadcrumbItem>
        </Breadcrumb>
        <Flex w="full" flexDir="row">
          <HStack mr="1.25rem" overflow="auto" gap="0.75rem" flex={1}>
            <Box
              aria-hidden
              bg="brand.secondary.100"
              p="0.5rem"
              borderRadius="6px"
            >
              {icon}
            </Box>
            <Text
              noOfLines={1}
              as="h3"
              textStyle="h3"
              textOverflow="ellipsis"
              wordBreak="break-all"
            >
              {title}
            </Text>
          </HStack>
          <HStack>{buttons}</HStack>
        </Flex>
      </VStack>
      {preTableContent && preTableContent}
      {children}
    </VStack>
  )
}
