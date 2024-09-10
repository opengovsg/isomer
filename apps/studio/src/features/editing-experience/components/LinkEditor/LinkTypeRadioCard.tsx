import type { UseRadioProps } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import { Box, useRadio } from "@chakra-ui/react"

export const LinkTypeRadioCard = ({
  children,
  ...rest
}: PropsWithChildren<UseRadioProps>) => {
  const { getInputProps, getRadioProps } = useRadio(rest)

  return (
    <Box
      as="label"
      _first={{
        "> div": {
          borderLeftRadius: "base",
        },
      }}
      _last={{
        "> div": {
          borderRightRadius: "base",
        },
      }}
    >
      <input {...getInputProps()} />

      <Box
        {...getRadioProps()}
        cursor="pointer"
        border="1px solid"
        borderColor="base.divider.strong"
        bgColor="utility.ui"
        px="1rem"
        py="0.5rem"
        mx={0}
        _checked={{
          bgColor: "interaction.muted.main.active",
          color: "interaction.main.default",
          borderColor: "interaction.main.default",
        }}
        textTransform="none"
        fontWeight={500}
        lineHeight="1.25rem"
      >
        {children}
      </Box>
    </Box>
  )
}
