import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Box, chakra, FormControl, SimpleGrid } from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormLabel,
  Input,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiWrench } from "react-icons/bi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
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

  useEffect(() => {
    if (!isEnabled) {
      router.push(`/sites/${siteId}/settings`)
    }
  }, [])

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  const {
    watch,
    register,
    formState: { isDirty, errors },
  } = useZodForm({
    // TODO: Share this across frontend and backend
    schema: z.object({ siteName: z.string(), agencyName: z.string() }),
    defaultValues: { siteName, agencyName },
  })

  const updatedSiteName = watch("siteName")

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <chakra.form overflow="auto" height={0} minH="100%">
        <SimpleGrid columns={9} h="100%">
          <SettingsEditingLayout>
            <SettingsHeader
              title="Name and agency"
              icon={BiWrench}
              canPublish={updatedSiteName !== siteName}
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
            <FormControl isRequired isInvalid={!!errors.agencyName}>
              <FormLabel
                description={"This isn't displayed anywhere on your site"}
              >
                Website is owned by
              </FormLabel>
              <Input {...register("agencyName")} disabled />
            </FormControl>
          </SettingsEditingLayout>
          <Box gridColumn="6 / 10">
            <EditSettingsPreview />
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
