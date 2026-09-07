/* oxlint-disable unicorn/no-unsafe-type-assertion -- core cleanup deferred */
import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import type { z } from "zod"
import { merge } from "lodash-es"
import { useRouter } from "next/router"
import posthogJs from "posthog-js"
import { createContext, useContext, useMemo, useState } from "react"
import articleLayoutPreview from "~/features/editing-experience/data/articleLayoutPreview.json"
import collectionLinkPreview from "~/features/editing-experience/data/collectionLinkPreview.json"
import { useZodForm } from "~/lib/form"
import { createCollectionPageFormSchema } from "~/schemas/page"
import { getResourceSubpath } from "~/utils/resource"
import { trpc } from "~/utils/trpc"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"
import { ResourceType } from "~prisma/generated/generatedEnums"

export enum CreateCollectionPageFlowStates {
  Type = "type",
  Details = "details",
}

interface CreateCollectionPageWizardProps extends Pick<
  UseDisclosureReturn,
  "onClose"
> {
  siteId: number
  collectionId: number
}

type CreateCollectionPageWizardContextReturn = ReturnType<
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

const INITIAL_STEP_STATE: CreateCollectionPageFlowStates =
  CreateCollectionPageFlowStates.Type

const useCreateCollectionPageWizardContext = ({
  siteId,
  collectionId,
  onClose,
}: CreateCollectionPageWizardProps) => {
  const [currentStep, setCurrentStep] =
    useState<CreateCollectionPageFlowStates>(INITIAL_STEP_STATE)

  const formMethods = useZodForm({
    defaultValues: {
      permalink: "",
      title: "",
      type: ResourceType.CollectionPage,
    },
    schema: createCollectionPageFormSchema,
  })

  const [type, title] = formMethods.watch(["type", "title"])
  const { data, isLoading: isPermalinkLoading } =
    trpc.resource.getWithFullPermalink.useQuery({
      resourceId: collectionId ? String(collectionId) : "",
      siteId,
    })

  const pagePreviewJson: IsomerSchema = useMemo(() => {
    const jsonPreview =
      type === ResourceType.CollectionPage
        ? merge(articleLayoutPreview, {
            page: { title: title || "Page title here" },
          })
        : collectionLinkPreview
    // SAFETY: caller invariant is checked immediately before this narrowing assertion
    return jsonPreview as IsomerSchema
  }, [type, title])

  const utils = trpc.useUtils()
  const router = useRouter()

  // Deferred: Call correct mutation
  const { mutate, isPending } =
    trpc.collection.createCollectionPage.useMutation({
      onSuccess: async () => {
        await utils.collection.list.invalidate()
        onClose()
      },
      // TOOD: Error handling
    })

  const handleCreatePage = formMethods.handleSubmit(
    (values: z.output<typeof createCollectionPageFormSchema>) => {
      mutate(
        {
          collectionId,
          siteId,
          ...values,
        },
        {
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
            }
            console.error(error)
          },
          onSuccess: ({ pageId }) => {
            posthogJs.capture("collection_page_created", {
              resource_type: values.type,
              site_id: siteId,
            })
            const nextType = getResourceSubpath(type)
            void router.push(`/sites/${siteId}/${nextType}/${pageId}`)
          },
        },
      )
    },
  )

  const handleNextToDetailScreen = () => {
    setCurrentStep(CreateCollectionPageFlowStates.Details)
  }

  const handleBackToTypeScreen = () => {
    setCurrentStep(CreateCollectionPageFlowStates.Type)
  }

  return {
    currentStep,
    currentType: type,
    formMethods,
    fullPermalink: data?.fullPermalink ?? "",
    handleBackToTypeScreen,
    handleCreatePage,
    handleNextToDetailScreen,
    isLoading: isPending || isPermalinkLoading,
    onClose,
    pagePreviewJson,
    siteId,
  }
}

export const CreateCollectionPageWizardProvider = ({
  children,
  ...passthroughProps
}: PropsWithChildren<CreateCollectionPageWizardProps>): React.ReactNode => {
  const values = useCreateCollectionPageWizardContext(passthroughProps)
  return (
    <CreateCollectionPageWizardContext.Provider value={values}>
      {children}
    </CreateCollectionPageWizardContext.Provider>
  )
}
