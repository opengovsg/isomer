import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import { createContext, useContext, useState } from "react"

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

interface CreatePageWizardPassthroughProps
  extends Pick<UseDisclosureReturn, "onClose"> {
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

export const INITIAL_STEP_STATE: [CreatePageFlowStates, -1 | 1 | 0] = [
  CreatePageFlowStates.Layout,
  -1,
]

const useCreatePageWizardContext = (
  passthroughProps: CreatePageWizardPassthroughProps,
) => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  const { siteId, folderId } = passthroughProps

  const formMethods = useZodForm({
    schema: createPageFormSchema,
    defaultValues: {
      title: "",
      permalink: "",
      layout: "content",
    },
  })

  const utils = trpc.useUtils()

  const { mutate, isLoading } = trpc.page.createPage.useMutation({
    onSuccess: async () => {
      await utils.page.list.invalidate()
      passthroughProps.onClose()
    },
    // TOOD: Error handling
  })

  const handleCreatePage = formMethods.handleSubmit((values) => {
    mutate({
      siteId,
      folderId,
      ...values,
    })
  })

  const handleNextToDetailScreen = () => {
    setCurrentStep([CreatePageFlowStates.Details, 1])
  }

  const handleBackToLayoutScreen = () => {
    setCurrentStep([CreatePageFlowStates.Layout, -1])
  }

  return {
    currentStep,
    direction,
    setCurrentStep,
    formMethods,
    handleCreatePage,
    isLoading,
    handleNextToDetailScreen,
    handleBackToLayoutScreen,
    ...passthroughProps,
  }
}

export const CreatePageWizardProvider = ({
  children,
  ...passthroughProps
}: PropsWithChildren<CreatePageWizardPassthroughProps>): JSX.Element => {
  const values = useCreatePageWizardContext(passthroughProps)
  return (
    <CreatePageWizardContext.Provider value={values}>
      {children}
    </CreatePageWizardContext.Provider>
  )
}
