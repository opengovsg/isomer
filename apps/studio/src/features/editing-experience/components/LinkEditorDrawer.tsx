import type { Static } from "@sinclair/typebox"
import { Flex, Spacer, Text, VStack } from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { LAYOUT_PAGE_MAP } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import { useAtom } from "jotai"
import { isEmpty } from "lodash"
import { z } from "zod"

import type { CollectionLinkProps } from "../atoms"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { linkAtom } from "../atoms"
import { BRIEF_TOAST_SETTINGS } from "./constants"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

const editLinkSchema = z.object({
  linkId: z.coerce.number(),
  siteId: z.coerce.number(),
})

const InnerDrawer = () => {
  const schema = LAYOUT_PAGE_MAP.link
  const validateFn = ajv.compile<Static<typeof schema>>(schema)
  const { linkId, siteId } = useQueryParse(editLinkSchema)
  const [data, setLinkAtom] = useAtom(linkAtom)
  const { errors } = useBuilderErrors()
  const utils = trpc.useUtils()
  const toast = useToast()
  const [] = trpc.collection.readCollectionLink.useSuspenseQuery(
    {
      linkId,
      siteId,
    },
    {
      onSuccess: (data) => {
        setLinkAtom({
          ...(data.content.page as CollectionLinkProps),
          title: data.title,
        })
      },
      refetchOnWindowFocus: false,
    },
  )
  const { mutate, isLoading } =
    trpc.collection.updateCollectionLink.useMutation({
      onSuccess: () => {
        void utils.collection.readCollectionLink.invalidate()
        toast({
          title: "Link updated!",
          status: "success",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  return (
    <VStack gap="1.5rem" p="1.5rem" h="full">
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
          handleChange={(data) => setLinkAtom(data)}
        />
      </Flex>
      <Spacer />
      <Button
        w="full"
        alignSelf="flex-start"
        onClick={() => mutate({ siteId, linkId, ...data })}
        isDisabled={!isEmpty(errors) || !data.ref}
        isLoading={isLoading}
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
