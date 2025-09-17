import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box, chakra, FormControl, SimpleGrid } from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiWrench } from "react-icons/bi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { EditSettingsPreview } from "~/features/editing-experience/components/EditSettingsPreview"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { siteSchema } from "~/features/editing-experience/schema"
import { SettingsEditingLayout } from "~/features/settings/SettingsEditingLayout"
import { SettingsHeader } from "~/features/settings/SettingsHeader"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"
import { useNewSettingsPage } from "~/hooks/useNewSettingsPage"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import { updateSiteConfigSchema } from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const AgencySettingsPage: NextPageWithLayout = () => {
  const isEnabled = useNewSettingsPage()
  const router = useRouter()
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)
  const [{ siteName, agencyName }] = trpc.site.getConfig.useSuspenseQuery({
    id: siteId,
  })
  const trpcUtils = trpc.useUtils()
  const toast = useToast()

  const updateSiteConfigMutation = trpc.site.updateSiteConfig.useMutation({
    onSuccess: async ({ siteName }) => {
      toast({
        title: `Site ${siteName} updated successfully`,
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
      await trpcUtils.site.getConfig.invalidate({ id: siteId })
      await trpcUtils.site.getSiteName.invalidate({ siteId })
    },
    onError: (error) => {
      toast({
        title: "Failed to update site",
        description: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })

      resetField("siteName")
    },
  })

  useEffect(() => {
    if (!isEnabled) {
      void router.push(`/sites/${siteId}/settings`)
    }
  }, [])

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  const {
    resetField,
    handleSubmit,
    watch,
    register,
    formState: { errors },
  } = useZodForm({
    schema: updateSiteConfigSchema.omit({ siteId: true }),
    defaultValues: { siteName },
  })

  const updatedSiteName = watch("siteName")
  const isDirty = updatedSiteName !== siteName

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const onSubmit = handleSubmit((data) => {
    updateSiteConfigMutation.mutate({
      siteName: data.siteName,
      siteId,
    })
  })

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <chakra.form overflow="auto" height={0} minH="100%" onSubmit={onSubmit}>
        <SimpleGrid columns={9} h="100%">
          <SettingsEditingLayout>
            <SettingsHeader
              title="Name and agency"
              icon={BiWrench}
              canPublish={isDirty}
              isLoading={updateSiteConfigMutation.isPending}
            />
            <FormControl isRequired isInvalid={!!errors.siteName}>
              <FormLabel
                description={
                  "This is displayed on browser tabs, the footer, and the Search Results page. It’s also the default meta title of your homepage."
                }
              >
                Site name
              </FormLabel>
              <Input {...register("siteName")} />
              <FormErrorMessage>{errors.siteName?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired>
              <FormLabel
                description={"This isn't displayed anywhere on your site"}
              >
                Website is owned by
              </FormLabel>
              <Input value={agencyName ?? "No agency name set"} disabled />
            </FormControl>
          </SettingsEditingLayout>
          <Box gridColumn="6 / 10">
            <EditSettingsPreview siteName={updatedSiteName} />
          </Box>
        </SimpleGrid>
      </chakra.form>
    </>
  )
}

AgencySettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default AgencySettingsPage
