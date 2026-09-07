import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import { merge } from "lodash-es"
import { useRouter } from "next/router"
import posthog from "posthog-js"
import { createContext, useContext, useMemo, useState } from "react"
import articleLayoutPreview from "~/features/editing-experience/data/articleLayoutPreview.json"
import contentLayoutPreview from "~/features/editing-experience/data/contentLayoutPreview.json"
import databaseLayoutPreview from "~/features/editing-experience/data/databaseLayoutPreview.json"
import { useZodForm } from "~/lib/form"
import { createPageSchema } from "~/schemas/page"
import { trpc } from "~/utils/trpc"

export enum CreatePageFlowStates {
  Layout = "layout",
  Details = "details",
}

const createPageFormSchema = createPageSchema.omit({
  folderId: true,
  siteId: true,
})

interface CreatePageWizardProps extends Pick<UseDisclosureReturn, "onClose"> {
  siteId: number
  folderId?: number
}

type CreatePageWizardContextReturn = ReturnType<
  typeof useCreatePageWizardContext
>

const CreatePageWizardContext = createContext<
  CreatePageWizardContextReturn | undefined
>(undefined)

export const useCreatePageWizard = (): CreatePageWizardContextReturn => {
  const context = useContext(CreatePageWizardContext)
  if (!context) {
    throw new Error(
      `useCreatePageWizard must be used within a CreatePageWizardProvider component`,
    )
  }
  return context
}

const INITIAL_STEP_STATE: CreatePageFlowStates = CreatePageFlowStates.Layout

const useCreatePageWizardContext = ({
  siteId,
  folderId,
  onClose,
}: CreatePageWizardProps) => {
  const [currentStep, setCurrentStep] =
    useState<CreatePageFlowStates>(INITIAL_STEP_STATE)

  const formMethods = useZodForm({
    defaultValues: {
      layout: "content",
      permalink: "",
      title: "",
    },
    schema: createPageFormSchema,
  })

  const [layout, title] = formMethods.watch(["layout", "title"])
  const { data, isLoading: isPermalinkLoading } =
    trpc.resource.getWithFullPermalink.useQuery(
      {
        resourceId: folderId ? String(folderId) : "",
        siteId,
      },
      { enabled: !!folderId },
    )

  const layoutPreviewJson: IsomerSchema = useMemo(() => {
    let jsonPreview
    switch (layout) {
      case "content": {
        jsonPreview = contentLayoutPreview
        break
      }
      case "article": {
        jsonPreview = articleLayoutPreview
        break
      }
      case "database": {
        jsonPreview = databaseLayoutPreview
        break
      }
    }
    // SAFETY: layout preview JSON is merged with the wizard title before save
    return merge(jsonPreview, {
      page: {
        title: title || "Page title here",
      },
    }) as IsomerSchema
  }, [layout, title])

  const utils = trpc.useUtils()
  const router = useRouter()

  const { mutate, isPending } = trpc.page.createPage.useMutation({
    onSuccess: async () => {
      await utils.resource.listWithoutRoot.invalidate()
      onClose()
    },
    // Deferred: Error handling
  })

  const handleCreatePage = formMethods.handleSubmit((values) => {
    mutate(
      {
        folderId,
        siteId,
        ...values,
      },
      {
        onError: (error) => {
          if (error.data?.code === "CONFLICT") {
            formMethods.setError(
              "permalink",
              { message: error.message },
              { shouldFocus: true },
            )
          } else {
            console.error(error)
          }
        },
        onSuccess: ({ pageId }) => {
          posthog.capture("page_created", {
            has_parent_folder: !!folderId,
            layout: values.layout,
            site_id: siteId,
          })
          void router.push(`/sites/${siteId}/pages/${pageId}`)
        },
      },
    )
  })

  const handleNextToDetailScreen = () => {
    setCurrentStep(CreatePageFlowStates.Details)
  }

  const handleBackToLayoutScreen = () => {
    setCurrentStep(CreatePageFlowStates.Layout)
  }

  return {
    currentLayout: layout,
    currentStep,
    formMethods,
    fullPermalink: folderId ? data?.fullPermalink : "",
    handleBackToLayoutScreen,
    handleCreatePage,
    handleNextToDetailScreen,
    isLoading: isPending || (!!folderId && isPermalinkLoading),
    layoutPreviewJson,
    onClose,
    siteId,
  }
}

export const CreatePageWizardProvider = ({
  children,
  ...passthroughProps
}: PropsWithChildren<CreatePageWizardProps>): React.ReactNode => {
  const values = useCreatePageWizardContext(passthroughProps)
  return (
    <CreatePageWizardContext.Provider value={values}>
      {children}
    </CreatePageWizardContext.Provider>
  )
}
