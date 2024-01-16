import { FC } from "react"
import { ChakraProvider, ChakraProviderProps } from "@chakra-ui/react"
import { extendTheme } from "@chakra-ui/react"

import { theme } from "./theme"

interface ThemeProviderProps extends ChakraProviderProps {
  primaryColour: string
  secondaryColour: string
  secondaryHover: string
  mediaColourOne: string
  mediaColourTwo: string
  mediaColourThree: string
  mediaColourFour: string
  mediaColourFive: string
}

/**
 * The global provider that must be added to make all components in this design
 * system work correctly
 */
export const ThemeProvider: FC<ThemeProviderProps> = ({
  primaryColour,
  secondaryColour,
  secondaryHover,
  mediaColourOne,
  mediaColourTwo,
  mediaColourThree,
  mediaColourFour,
  mediaColourFive,
  ...rest
}) => {
  const updatedTheme = extendTheme(
    {
      colors: {
        primaryColour,
        secondaryColour,
        secondaryHover,
        mediaColourOne,
        mediaColourTwo,
        mediaColourThree,
        mediaColourFour,
        mediaColourFive,
      },
    },
    theme,
  )
  return <ChakraProvider portalZIndex={40} theme={updatedTheme} {...rest} />
}

export default ThemeProvider
