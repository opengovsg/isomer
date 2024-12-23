import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { merge } from "lodash"

import articleLayoutPreview from "~/features/editing-experience/data/articleLayoutPreview.json"
import contentLayoutPreview from "~/features/editing-experience/data/contentLayoutPreview.json"
import { useZodForm } from "~/lib/form"
import { createPageSchema } from "~/schemas/page"
import { trpc } from "~/utils/trpc"

export enum CreatePageFlowStates {
  Layout = "layout",
  Details = "details",
}

const createPageFormSchema = createPageSchema.omit({
  siteId: true,
  folderId: true,
})

interface CreatePageWizardProps extends Pick<UseDisclosureReturn, "onClose"> {
  siteId: number
  folderId?: number
}

export type CreatePageWizardContextReturn = ReturnType<
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

export const INITIAL_STEP_STATE: CreatePageFlowStates =
  CreatePageFlowStates.Layout

const useCreatePageWizardContext = ({
  siteId,
  folderId,
  onClose,
}: CreatePageWizardProps) => {
  const [currentStep, setCurrentStep] =
    useState<CreatePageFlowStates>(INITIAL_STEP_STATE)

  const formMethods = useZodForm({
    schema: createPageFormSchema,
    defaultValues: {
      title: "",
      permalink: "",
      layout: "content",
    },
  })

  const [layout, title] = formMethods.watch(["layout", "title"])
  const { data, isLoading: isPermalinkLoading } =
    trpc.resource.getWithFullPermalink.useQuery(
      {
        resourceId: folderId ? String(folderId) : "",
      },
      { enabled: !!folderId },
    )

  const layoutPreviewJson: IsomerSchema = useMemo(() => {
    const jsonPreview =
      layout === "content" ? contentLayoutPreview : articleLayoutPreview
    return merge(jsonPreview, {
      page: {
        title: title || "Page title here",
      },
    }) as IsomerSchema
  }, [layout, title])

  const utils = trpc.useUtils()
  const router = useRouter()

  const { mutate, isLoading } = trpc.page.createPage.useMutation({
    onSuccess: async () => {
      await utils.resource.listWithoutRoot.invalidate()
      onClose()
    },
    // TODO: Error handling
  })

  const handleCreatePage = formMethods.handleSubmit((values) => {
    mutate(
      {
        siteId,
        folderId,
        ...values,
      },
      {
        onSuccess: ({ pageId }) => {
          void router.push(`/sites/${siteId}/pages/${pageId}`)
        },
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
    siteId,
    currentStep,
    formMethods,
    handleCreatePage,
    isLoading: isLoading || (!!folderId && isPermalinkLoading),
    handleNextToDetailScreen,
    handleBackToLayoutScreen,
    layoutPreviewJson,
    onClose,
    currentLayout: layout,
    fullPermalink: !!folderId ? data?.fullPermalink : "",
  }
}

export const CreatePageWizardProvider = ({
  children,
  ...passthroughProps
}: PropsWithChildren<CreatePageWizardProps>): JSX.Element => {
  const values = useCreatePageWizardContext(passthroughProps)
  return (
    <CreatePageWizardContext.Provider value={values}>
      {children}
    </CreatePageWizardContext.Provider>
  )
}
