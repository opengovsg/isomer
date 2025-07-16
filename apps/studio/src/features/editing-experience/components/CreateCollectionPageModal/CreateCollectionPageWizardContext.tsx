import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { merge } from "lodash"

import articleLayoutPreview from "~/features/editing-experience/data/articleLayoutPreview.json"
import collectionLinkPreview from "~/features/editing-experience/data/collectionLinkPreview.json"
import { useZodForm } from "~/lib/form"
import { createCollectionPageFormSchema } from "~/schemas/page"
import { getResourceSubpath } from "~/utils/resource"
import { trpc } from "~/utils/trpc"

export enum CreateCollectionPageFlowStates {
  Type = "type",
  Details = "details",
}

interface CreateCollectionPageWizardProps
  extends Pick<UseDisclosureReturn, "onClose"> {
  siteId: number
  collectionId: number
}

export type CreateCollectionPageWizardContextReturn = ReturnType<
  typeof useCreateCollectionPageWizardContext
>

const CreateCollectionPageWizardContext = createContext<
  CreateCollectionPageWizardContextReturn | undefined
>(undefined)

export const useCreateCollectionPageWizard =
  (): CreateCollectionPageWizardContextReturn => {
    const context = useContext(CreateCollectionPageWizardContext)
    if (!context) {
      throw new Error(
        `useCreateCollectionPageWizard must be used within a CreateCollectionPageWizardProvider component`,
      )
    }
    return context
  }

export const INITIAL_STEP_STATE: CreateCollectionPageFlowStates =
  CreateCollectionPageFlowStates.Type

const useCreateCollectionPageWizardContext = ({
  siteId,
  collectionId,
  onClose,
}: CreateCollectionPageWizardProps) => {
  const [currentStep, setCurrentStep] =
    useState<CreateCollectionPageFlowStates>(INITIAL_STEP_STATE)

  const formMethods = useZodForm({
    schema: createCollectionPageFormSchema,
    defaultValues: {
      title: "",
      permalink: "",
      type: ResourceType.CollectionPage,
    },
  })

  const [type, title] = formMethods.watch(["type", "title"])
  const { data, isLoading: isPermalinkLoading } =
    trpc.resource.getWithFullPermalink.useQuery({
      siteId,
      resourceId: collectionId ? String(collectionId) : "",
    })

  const pagePreviewJson: IsomerSchema = useMemo(() => {
    const jsonPreview =
      type === ResourceType.CollectionPage
        ? merge(articleLayoutPreview, {
            page: { title: title || "Page title here" },
          })
        : collectionLinkPreview
    return jsonPreview as IsomerSchema
  }, [type, title])

  const utils = trpc.useUtils()
  const router = useRouter()

  // TODO: Call correct mutation
  const { mutate, isLoading } =
    trpc.collection.createCollectionPage.useMutation({
      onSuccess: async () => {
        await utils.collection.list.invalidate()
        onClose()
      },
      // TOOD: Error handling
    })

  const handleCreatePage = formMethods.handleSubmit((values) => {
    mutate(
      {
        siteId,
        collectionId,
        ...values,
      },
      {
        onSuccess: ({ pageId }) => {
          const nextType = getResourceSubpath(type)
          void router.push(`/sites/${siteId}/${nextType}/${pageId}`)
        },
        onError: (error) => {
          if (
            error.data?.code === "CONFLICT" &&
            values.type === ResourceType.CollectionPage
          ) {
            formMethods.setError(
              "permalink",
              { message: error.message },
              { shouldFocus: true },
            )
            return
          } else if (
            error.data?.code === "CONFLICT" &&
            values.type === ResourceType.CollectionLink
          ) {
            formMethods.setError(
              "title",
              { message: error.message },
              { shouldFocus: true },
            )
            return
          } else {
            console.error(error)
          }
        },
      },
    )
  })

  const handleNextToDetailScreen = () => {
    setCurrentStep(CreateCollectionPageFlowStates.Details)
  }

  const handleBackToTypeScreen = () => {
    setCurrentStep(CreateCollectionPageFlowStates.Type)
  }

  return {
    siteId,
    currentStep,
    formMethods,
    handleCreatePage,
    isLoading: isLoading || isPermalinkLoading,
    handleNextToDetailScreen,
    handleBackToTypeScreen,
    pagePreviewJson,
    onClose,
    currentType: type,
    fullPermalink: data?.fullPermalink || "",
  }
}

export const CreateCollectionPageWizardProvider = ({
  children,
  ...passthroughProps
}: PropsWithChildren<CreateCollectionPageWizardProps>): JSX.Element => {
  const values = useCreateCollectionPageWizardContext(passthroughProps)
  return (
    <CreateCollectionPageWizardContext.Provider value={values}>
      {children}
    </CreateCollectionPageWizardContext.Provider>
  )
}
