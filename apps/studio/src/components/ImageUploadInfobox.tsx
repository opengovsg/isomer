import { PropsWithChildren } from "react"
import { Box, Flex, FormControl, Text } from "@chakra-ui/react"
import { Button, FormLabel } from "@opengovsg/design-system-react"

interface ImageUploadProps {
  data?: string
  required?: boolean
  label: string
  onClick: () => void
  description?: string
}
export const ImageUploadInfobox = ({
  children,
  required,
  description,
  label,
  onClick,
}: PropsWithChildren<ImageUploadProps>) => {
  return (
    <Box as={FormControl} isRequired={required}>
      <FormLabel>{label}</FormLabel>
      <Flex
        px="1rem"
        py="0.75rem"
        flexDir="row"
        background="brand.primary.100"
        justifyContent="space-between"
        alignItems="center"
      >
        {!!children ? (
          children
        ) : (
          <>
            <Text>{description}</Text>
            <Button
              onClick={onClick}
              variant="link"
              aria-labelledby="button-label"
            >
              <Text id="button-label" textStyle="subhead-2">
                Link something...
              </Text>
            </Button>
          </>
        )}
      </Flex>
    </Box>
  )
}
