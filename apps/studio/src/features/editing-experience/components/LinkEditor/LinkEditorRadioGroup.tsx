import type { UseRadioProps } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import {
  Box,
  HStack,
  Icon,
  Text,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react"

import type { LinkTypes } from "./constants"
import { LINK_TYPES } from "./constants"
import { useLinkEditor } from "./LinkEditorContext"

const LinkTypeRadioCard = ({
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

export const LinkEditorRadioGroup = () => {
  const { linkTypes, setCurType } = useLinkEditor()
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "link-type",
    defaultValue: LINK_TYPES.Page,
    // NOTE: This is a safe cast because we map over the `linkTypes` below
    // so each time we are using the `linkType`
    onChange: (value) => setCurType(value as LinkTypes),
  })

  return (
    <HStack {...getRootProps()} spacing={0}>
      {Object.entries(linkTypes).map(([key, props]) => {
        if (!props) return null
        const { icon, label } = props
        const radio = getRadioProps({ value: key })

        return (
          <LinkTypeRadioCard key={key} {...radio}>
            <HStack spacing={2}>
              <Icon as={icon} fontSize="1.25rem" />
              <Text textStyle="subhead-2">{label}</Text>
            </HStack>
          </LinkTypeRadioCard>
        )
      })}
    </HStack>
  )
}
