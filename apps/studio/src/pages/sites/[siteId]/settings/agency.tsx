import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import {
  Button,
  Center,
  chakra,
  FormControl,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  Infobox,
  Input,
  Toggle,
  useToast,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiWrench } from "react-icons/bi"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { siteSchema } from "~/features/editing-experience/schema"
import { SettingsEditingLayout } from "~/features/settings/SettingsEditingLayout"
import { SettingsHeader } from "~/features/settings/SettingsHeader"
import { useNewSettingsPage } from "~/hooks/useNewSettingsPage"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import { setNotificationSchema } from "~/schemas/site"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"

const AgencySettingsPage: NextPageWithLayout = () => {
  const isEnabled = useNewSettingsPage()
  const router = useRouter()
  const { siteId: rawSiteId } = useQueryParse(siteSchema)
  const siteId = Number(rawSiteId)

  useEffect(() => {
    if (!isEnabled) {
      router.push(`/sites/${siteId}/settings`)
    }
  }, [])

  const toast = useToast()
  const trpcUtils = trpc.useUtils()

  // NOTE: Refining the setNotificationSchema here instead of in site.ts since omit does not work after refine
  const { register, handleSubmit, watch, formState, reset } = useZodForm({
    schema: setNotificationSchema
      .omit({ siteId: true })
      .refine((data) => !data.notificationEnabled || data.notification, {
        message: "Notification must not be empty",
        path: ["notification"],
      }),
  })

  const [notificationEnabled, notification] = watch([
    "notificationEnabled",
    "notification",
  ])

  const { isDirty, errors } = formState

  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (isDirty) {
        router.events.off("routeChangeStart", handleRouteChange)
        setNextUrl(url)
        router.events.emit("routeChangeError")
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "Error to abort router route change. Ignore this!"
      }
    }

    if (!isOpen) {
      router.events.on("routeChangeStart", handleRouteChange)
    }
    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
  }, [isOpen, router.events, isDirty])

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <chakra.form
        // onSubmit={onClickUpdate}
        overflow="auto"
        height={0}
        minH="100%"
      >
        <SettingsEditingLayout>
          <SettingsHeader title="Name and agency" icon={BiWrench} />
        </SettingsEditingLayout>
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
