import { useEffect } from "react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  FormControl,
  Input,
  List,
  ListItem,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormLabel,
  useToast,
} from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useZodForm } from "~/lib/form"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { type NextPageWithLayout } from "~/lib/types"
import { createSiteSchema } from "~/schemas/site"
import { AdminLayout } from "~/templates/layouts/AdminLayout"
import { trpc } from "~/utils/trpc"

const GodModeCreateSitePage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE],
  })

  if (!isUserIsomerAdmin) {
    toast({
      title: "You do not have permission to access this page.",
      status: "error",
      ...BRIEF_TOAST_SETTINGS,
    })
    void router.push(`/`)
  }

  const createSiteMutation = trpc.site.create.useMutation()

  useEffect(() => {
    if (createSiteMutation.isSuccess) {
      const { siteId, siteName } = createSiteMutation.data
      toast({
        title: `Site ${siteName} (id: ${siteId}) created successfully`,
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
      void router.push(`/sites/${siteId}`)
    }
  }, [createSiteMutation.isSuccess, createSiteMutation.data, toast, router])

  useEffect(() => {
    if (createSiteMutation.isError) {
      toast({
        title: "Failed to create site",
        description: createSiteMutation.error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [createSiteMutation.isError, createSiteMutation.error, toast])

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
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" as={NextLink}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/godmode" as={NextLink}>
            👁️ God Mode 👁️
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Text as="h3" size="lg" textStyle="h3">
        Create a new site
      </Text>

      <Box mt={8} bg="white" borderRadius="md" p={4}>
        <Text fontWeight="bold" mb={4}>
          What happens when you create a site?
        </Text>
        <List spacing={3}>
          <ListItem>
            1. A new site will be created with basic setup including default
            homepage, navbar and footer.
          </ListItem>
          <ListItem>
            2. All Isomer team members will be added as site admins with full
            access to manage the site.
          </ListItem>
        </List>
      </Box>

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
          isLoading={createSiteMutation.isPending}
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
