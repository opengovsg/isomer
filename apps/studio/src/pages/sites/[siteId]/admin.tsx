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
  Textarea,
  useToast,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import { setSiteConfigAdminSchema } from "~/schemas/site"
import { AdminSidebarOnlyLayout } from "~/templates/layouts/AdminSidebarOnlyLayout"
import { trpc } from "~/utils/trpc"

const siteAdminSchema = z.object({
  siteId: z.coerce.number(),
})

const SUPPORTED_SITE_CONFIG_TYPES = [
  "config",
  "theme",
  "navbar",
  "footer",
] as const

const SiteAdminPage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const trpcUtils = trpc.useUtils()
  const { siteId } = useQueryParse(siteAdminSchema)
  const isUserIsomerAdmin = useIsUserIsomerAdmin()

  if (!isUserIsomerAdmin) {
    toast({
      title: "You do not have permission to access this page.",
      status: "error",
      ...BRIEF_TOAST_SETTINGS,
    })
    void router.push(`/sites/${siteId}`)
  }

  const { mutate, isLoading } = trpc.site.setSiteConfigAdmin.useMutation({
    onSuccess: async () => {
      // reset({ config, theme, navbar, footer })
      await trpcUtils.site.getConfig.invalidate({ id: siteId })
      await trpcUtils.site.getTheme.invalidate({ id: siteId })
      await trpcUtils.site.getNavbar.invalidate({ id: siteId })
      await trpcUtils.site.getFooter.invalidate({ id: siteId })
      toast({
        title: "Saved site config!",
        description: "Check your site in 5-10 minutes to view it live.",
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: () => {
      toast({
        title: "Error saving site config!",
        description:
          "If this persists, please report this issue at support@isomer.gov.sg",
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const [previousConfig] = trpc.site.getConfig.useSuspenseQuery({
    id: siteId,
  })
  const [previousTheme] = trpc.site.getTheme.useSuspenseQuery({
    id: siteId,
  })
  const [previousNavbar] = trpc.site.getNavbar.useSuspenseQuery({
    id: siteId,
  })
  const [previousFooter] = trpc.site.getFooter.useSuspenseQuery({
    id: siteId,
  })

  // NOTE: Refining the setNotificationSchema here instead of in site.ts since omit does not work after refine
  const {
    register,
    handleSubmit,
    formState: { isDirty, errors },
  } = useZodForm({
    schema: setSiteConfigAdminSchema
      .omit({ siteId: true })
      .refine((data) => !!data.config, {
        message: "Site config must be present",
        path: ["config"],
      })
      .refine((data) => !!data.theme, {
        message: "Site theme must be present",
        path: ["theme"],
      })
      .refine((data) => !!data.navbar, {
        message: "Site navbar must be present",
        path: ["navbar"],
      })
      .refine((data) => !!data.footer, {
        message: "Site footer must be present",
        path: ["footer"],
      }),
    defaultValues: {
      config: JSON.stringify(previousConfig, null, 2),
      theme: JSON.stringify(previousTheme, null, 2),
      navbar: JSON.stringify(previousNavbar.content, null, 2),
      footer: JSON.stringify(previousFooter.content, null, 2),
    },
  })

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

  const onClickUpdate = handleSubmit((input) => {
    mutate({
      siteId,
      ...input,
    })
  })

  return (
    <>
      <UnsavedSettingModal
        isOpen={isOpen}
        onClose={() => setNextUrl("")}
        nextUrl={nextUrl}
      />
      <chakra.form
        onSubmit={onClickUpdate}
        overflow="auto"
        height={0}
        minH="100%"
      >
        <Center py="5.5rem" px="2rem">
          <VStack w="48rem" alignItems="flex-start" spacing="1.5rem">
            <Text w="full" textStyle="h3-semibold">
              Manage site configurations
            </Text>
            <Infobox variant="warning" textStyle="body-2" size="sm">
              No validation is done on the JSON input. Please ensure that they
              are valid before saving.
            </Infobox>

            {SUPPORTED_SITE_CONFIG_TYPES.map((type) => (
              <FormControl key={type} isInvalid={!!errors[type]}>
                <VStack w="full" alignItems="flex-start" spacing="0.75rem">
                  <Text
                    textColor="base.content.strong"
                    textStyle="subhead-1"
                    pt="0.5rem"
                  >
                    Site {type}
                  </Text>

                  <Textarea
                    fontFamily="monospace"
                    boxSizing="border-box"
                    minH="18rem"
                    {...register(type)}
                  />

                  <FormErrorMessage>{errors[type]?.message}</FormErrorMessage>
                </VStack>
              </FormControl>
            ))}

            <HStack justifyContent="flex-end" w="full" gap="1.5rem">
              <Text textColor="base.content.medium" textStyle="caption-2">
                Changes will be reflected on your site immediately.
              </Text>

              <Button type="submit" isLoading={isLoading} isDisabled={!isDirty}>
                Save settings
              </Button>
            </HStack>
          </VStack>
        </Center>
      </chakra.form>
    </>
  )
}

SiteAdminPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={AdminSidebarOnlyLayout(page)}
    />
  )
}

export default SiteAdminPage
