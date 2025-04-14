import NextLink from "next/link"
import { useRouter } from "next/router"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FormLabel, useToast } from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import { createSiteSchema } from "~/schemas/site"
import { AdminLayout } from "~/templates/layouts/AdminLayout"
import { trpc } from "~/utils/trpc"

const GodModeCreateSitePage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const isUserIsomerAdmin = useIsUserIsomerAdmin()

  if (!isUserIsomerAdmin) {
    toast({
      title: "You do not have permission to access this page.",
      status: "error",
      ...BRIEF_TOAST_SETTINGS,
    })
    void router.push(`/`)
  }

  const createSiteMutation = trpc.site.create.useMutation({
    onSuccess: ({ siteId, siteName }) => {
      toast({
        title: `Site ${siteName} (id: ${siteId}) created successfully`,
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
      void router.push(`/sites/${siteId}`)
    },
    onError: (error) => {
      toast({
        title: "Failed to create site",
        description: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm({
    schema: createSiteSchema,
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const onSubmit = handleSubmit((data) => {
    createSiteMutation.mutate({
      siteName: data.siteName,
    })
  })

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Flex flexDirection="column">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/godmode" as={NextLink}>
              👁️ God Mode 👁️
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <Text as="h3" size="lg" textStyle="h3">
          Create a new site
        </Text>
      </Flex>

      <VStack spacing={4} mt={8} align="stretch">
        <FormControl isRequired isInvalid={!!errors.siteName}>
          <FormLabel>Site name</FormLabel>
          <Input
            placeholder="Ministry of Isomer"
            {...register("siteName")}
            size="lg"
          />
          {errors.siteName && (
            <FormErrorMessage>{errors.siteName.message}</FormErrorMessage>
          )}
        </FormControl>
        <Button
          variant="solid"
          width="full"
          onClick={onSubmit}
          isLoading={createSiteMutation.isLoading}
          isDisabled={Object.keys(errors).length > 0}
        >
          Create Site
        </Button>
      </VStack>
    </Flex>
  )
}

GodModeCreateSitePage.getLayout = AdminLayout

export default GodModeCreateSitePage
