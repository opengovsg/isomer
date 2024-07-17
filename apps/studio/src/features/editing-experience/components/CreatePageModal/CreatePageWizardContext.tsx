import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { z } from "zod"
import { createContext, useContext, useState } from "react"

import { useZodForm } from "~/lib/form"
import { createPageSchema } from "~/schemas/page"

export enum CreatePageFlowStates {
  Setup = "setup",
  Layout = "layout",
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

export interface CreatePageWizardContextReturn
  extends CreatePageWizardPassthroughProps {
  currentStep: CreatePageFlowStates
  direction: number
  setCurrentStep: React.Dispatch<
    React.SetStateAction<[CreatePageFlowStates, -1 | 1 | 0]>
  >
  formMethods: UseFormReturn<z.input<typeof createPageFormSchema>>
}

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
  CreatePageFlowStates.Setup,
  -1,
]

const useCreatePageWizardContext = (
  passthroughProps: CreatePageWizardPassthroughProps,
) => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  const formMethods = useZodForm({
    schema: createPageFormSchema,
    defaultValues: {
      title: "",
      permalink: "",
      layout: "content",
    },
  })

  return {
    currentStep,
    direction,
    setCurrentStep,
    formMethods,
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
