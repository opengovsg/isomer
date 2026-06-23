import { createContext } from "react"

export interface BlockConfigs {
  [blockId: string]: Record<string, string>
}

export const BlockConfigContext = createContext<{
  configs: BlockConfigs
  setConfig: (blockId: string, key: string, value: string) => void
}>({
  configs: {},
  setConfig: () => {},
})
