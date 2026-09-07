import type { ComplexIntegrations } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { AskgovLogo } from "~/components/Svg/Askgov"
import { VicaLogo } from "~/components/Svg/Vica"

// zendesk is not user-editable in studio, so only pick the editable widget types
export type WidgetType = Extract<ComplexIntegrations, "askgov" | "vica">

interface Widget {
  icon: React.ReactNode
  label: string
}
export const WIDGET_CONFIG = {
  askgov: {
    icon: <AskgovLogo width="5rem" />,
    label: "AskGov",
  },
  vica: {
    icon: <VicaLogo width="5rem" ml="-8px" />,
    label: "VICA",
  },
} satisfies Record<WidgetType, Widget>

interface UseWidgetContextReturn {
  activeWidget: WidgetType | null
  setActiveWidget: (widget: WidgetType | null) => void
  getNextWidget: (widget: WidgetType) => WidgetType
}

const WidgetContext = createContext<null | UseWidgetContextReturn>(null)

export const WidgetProvider = ({
  children,
  activeWidget: currentActiveWidget,
}: PropsWithChildren<Pick<UseWidgetContextReturn, "activeWidget">>) => {
  const [selectedWidget, setSelectedWidget] = useState(currentActiveWidget)
  const [prevActiveWidget, setPrevActiveWidget] = useState(currentActiveWidget)

  if (currentActiveWidget !== prevActiveWidget) {
    setPrevActiveWidget(currentActiveWidget)
    setSelectedWidget(currentActiveWidget)
  }

  const getNextWidget = useCallback(
    (curWidget: WidgetType) => {
      if (!selectedWidget) {
        return curWidget
      }

      return selectedWidget === "askgov" ? "vica" : "askgov"
    },
    [selectedWidget],
  )

  const contextValue = useMemo(
    () => ({
      activeWidget: selectedWidget,
      getNextWidget,
      setActiveWidget: setSelectedWidget,
    }),
    [selectedWidget, getNextWidget],
  )

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  )
}

export const useWidget = () => {
  const val = useContext(WidgetContext)

  if (val === null) {
    throw new Error("useWidget must be used within a WidgetProvider")
  }

  return val
}
