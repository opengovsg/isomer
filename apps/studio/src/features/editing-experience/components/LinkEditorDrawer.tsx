import type { Static } from "@sinclair/typebox"
import { Flex, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { LAYOUT_PAGE_MAP } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import { useAtomValue, useSetAtom } from "jotai"
import { isEmpty } from "lodash"

import { linkAtom } from "../atoms"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

const InnerDrawer = () => {
  const schema = LAYOUT_PAGE_MAP.link
  const validateFn = ajv.compile<Static<typeof schema>>(schema)
  const setLinkAtom = useSetAtom(linkAtom)
  const data = useAtomValue(linkAtom)
  const { errors } = useBuilderErrors()

  return (
    <VStack gap="1.5rem" p="1.5rem">
      <Flex flexDir="column" alignItems="flex-start" w="full">
        <Text as="h6" textStyle="h6">
          Edit collection item
        </Text>
        <Text
          as="caption"
          textStyle="caption-2"
          textColor="base.content.medium"
        >
          When this collection item is clicked, open:
        </Text>
      </Flex>
      <Flex flexDir="column" alignItems="start" w="full">
        <FormBuilder<Static<typeof schema>>
          schema={schema}
          validateFn={validateFn}
          data={data}
          handleChange={setLinkAtom}
        />
      </Flex>
      <Button
        alignSelf="flex-start"
        onClick={() => console.log(data)}
        isDisabled={!isEmpty(errors) || !data.ref}
      >
        Save
      </Button>
    </VStack>
  )
}

export const LinkEditorDrawer = () => {
  return (
    <ErrorProvider>
      <InnerDrawer />
    </ErrorProvider>
  )
}