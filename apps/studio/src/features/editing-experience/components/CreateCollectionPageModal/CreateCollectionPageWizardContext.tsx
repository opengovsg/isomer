import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo } from "react"
import { useRouter } from "next/router"
import { merge } from "lodash"

import articleLayoutPreview from "~/features/editing-experience/data/articleLayoutPreview.json"
import collectionPdfPreview from "~/features/editing-experience/data/collectionPdfPreview.json"
import { useZodForm } from "~/lib/form"
import { createCollectionPageFormSchema } from "~/schemas/page"
import { trpc } from "~/utils/trpc"

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

const useCreateCollectionPageWizardContext = ({
  siteId,
  collectionId,
  onClose,
}: CreateCollectionPageWizardProps) => {
  const formMethods = useZodForm({
    schema: createCollectionPageFormSchema,
    defaultValues: {
      title: "",
      permalink: "",
      type: "page",
    },
  })

  const [type, title] = formMethods.watch(["type", "title"])

  const pagePreviewJson: IsomerSchema = useMemo(() => {
    const jsonPreview =
      type === "page" ? articleLayoutPreview : collectionPdfPreview
    return merge(jsonPreview, {
      page: { title: title || "Page title here" },
    }) as IsomerSchema
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
      // TODO: Error handling
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

  return {
    siteId,
    formMethods,
    handleCreatePage,
    isLoading,
    pagePreviewJson,
    onClose,
    currentType: type,
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
