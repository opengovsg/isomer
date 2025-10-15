import type { ComplexIntegrations } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import { createContext, useContext, useState } from "react"
import { SimplifyDeep } from "type-fest"

import { AskgovLogo } from "~/components/Svg/Askgov"
import { VicaLogo } from "~/components/Svg/Vica"

interface Widget {
  icon: JSX.Element
  label: string
}
export const WIDGET_CONFIG: Record<WidgetType, Widget> = {
  askgov: {
    icon: <AskgovLogo width="5rem" />,
    label: "AskGov",
  },
  vica: {
    icon: <VicaLogo width="5rem" ml="-8px" />,
    label: "Vica",
  },
}

export type WidgetType = SimplifyDeep<ComplexIntegrations>

interface UseWidgetContextReturn {
  activeWidget: WidgetType | null
  setActiveWidget: (widget: WidgetType | null) => void
  getNextWidget: (widget: WidgetType) => WidgetType
}

export const WidgetContext = createContext<null | UseWidgetContextReturn>(null)

export const WidgetProvider = ({
  children,
  activeWidget: currentActiveWidget,
}: PropsWithChildren<Pick<UseWidgetContextReturn, "activeWidget">>) => {
  const [activeWidget, setActiveWidget] = useState<WidgetType | null>(
    currentActiveWidget,
  )
  const getNextWidget = (widget: WidgetType) => {
    if (!activeWidget) return widget

    return activeWidget === "askgov" ? "vica" : "askgov"
  }

  return (
    <WidgetContext.Provider
      value={{ activeWidget, setActiveWidget, getNextWidget }}
    >
      {children}
    </WidgetContext.Provider>
  )
}

export const useWidget = () => {
  const val = useContext(WidgetContext)

  if (val === null)
    throw new Error("useWidget must be used within a WidgetProvider")

  return val
}
