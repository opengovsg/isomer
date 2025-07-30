import type { Static } from "@sinclair/typebox"
import { useEffect, useMemo, useState } from "react"
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { LAYOUT_PAGE_MAP } from "@opengovsg/isomer-components"
import { useAtom, useSetAtom } from "jotai"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"
import { z } from "zod"

import type { CollectionLinkProps } from "../atoms"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { trpc } from "~/utils/trpc"
import { linkAtom, linkRefAtom } from "../atoms"
import { ActivateRawJsonEditorMode } from "./ActivateRawJsonEditorMode"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"
import { RawJsonEditor } from "./RawJsonEditor"

const schema = LAYOUT_PAGE_MAP.link
type IsomerLinkSchema = Static<typeof schema>
const validateFn = ajv.compile<IsomerLinkSchema>(schema)

const editLinkSchema = z.object({
  linkId: z.coerce.number(),
  siteId: z.coerce.number(),
})

interface LinkEditorDrawerStateProps {
  savedPageState: IsomerLinkSchema
  previewPageState: IsomerLinkSchema
  isLoading: boolean
  handleChange: (data: IsomerLinkSchema) => void
  handleSaveChanges: () => void
  setDrawerState: (state: "root" | "rawJsonEditor") => void
}

const InnerDrawer = ({
  previewPageState,
  isLoading,
  handleChange,
  handleSaveChanges,
  setDrawerState,
}: LinkEditorDrawerStateProps) => {
  const { errors } = useBuilderErrors()
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
  })

  return (
    <Flex flexDir="column" position="relative" h="100%" w="100%">
      {isUserIsomerAdmin && (
        <ActivateRawJsonEditorMode
          onActivate={() => setDrawerState("rawJsonEditor")}
        />
      )}

      <VStack h="full" gap="1.5rem" p="1.5rem" overflow="auto">
        <Flex flexDir="column" alignItems="flex-start" w="full">
          <Text as="h6" textStyle="h6">
            Edit collection item
          </Text>
        </Flex>
        <Flex flexDir="column" alignItems="start" w="full">
          <FormBuilder<IsomerLinkSchema>
            schema={schema}
            validateFn={validateFn}
            data={previewPageState}
            handleChange={handleChange}
          />
        </Flex>
      </VStack>
      <Box
        w="full"
        bgColor="base.canvas.default"
        boxShadow="md"
        py="1.5rem"
        px="2rem"
        pos="relative"
      >
        <Button
          w="full"
          alignSelf="flex-start"
          onClick={handleSaveChanges}
          isDisabled={!isEmpty(errors) || !previewPageState.ref}
          isLoading={isLoading}
        >
          Save
        </Button>
      </Box>
    </Flex>
  )
}

const RawJsonEditorDrawer = ({
  savedPageState,
  previewPageState,
  isLoading,
  handleChange,
  handleSaveChanges,
  setDrawerState,
}: LinkEditorDrawerStateProps) => {
  const [pendingChanges, setPendingChanges] = useState(
    JSON.stringify(savedPageState, null, 2),
  )
  const isPendingChangesValid = useMemo(() => {
    return validateFn(safeJsonParse(pendingChanges))
  }, [pendingChanges])

  const handleRawChange = (data: string) => {
    setPendingChanges(data)
    const parsedRawChange = safeJsonParse(data) as unknown

    if (validateFn(parsedRawChange)) {
      handleChange(parsedRawChange)
    }
  }

  const handleDiscardChanges = () => {
    handleChange(savedPageState)
    setDrawerState("root")
  }

  const handleRawSaveChanges = () => {
    handleSaveChanges()
    setDrawerState("root")
  }

  return (
    <RawJsonEditor
      pendingChanges={pendingChanges}
      isLoading={isLoading}
      isModified={!isEqual(previewPageState, savedPageState)}
      isPendingChangesValid={isPendingChangesValid}
      handleChange={handleRawChange}
      handleDiscardChanges={handleDiscardChanges}
      handleSaveChanges={handleRawSaveChanges}
    />
  )
}

const DrawerState = (
  props: Omit<LinkEditorDrawerStateProps, "setDrawerState">,
) => {
  const [drawerState, setDrawerState] = useState<"root" | "rawJsonEditor">(
    "root",
  )

  switch (drawerState) {
    case "root":
      return <InnerDrawer {...props} setDrawerState={setDrawerState} />
    case "rawJsonEditor":
      return <RawJsonEditorDrawer {...props} setDrawerState={setDrawerState} />
    default:
      const _: never = drawerState
      return <></>
  }
}

export const LinkEditorDrawer = () => {
  const { linkId, siteId } = useQueryParse(editLinkSchema)
  const [data, setLinkAtom] = useAtom(linkAtom)
  const utils = trpc.useUtils()
  const toast = useToast()
  const setLinkRef = useSetAtom(linkRefAtom)

  const [{ content, title }] =
    trpc.collection.readCollectionLink.useSuspenseQuery(
      {
        linkId,
        siteId,
      },
      {
        refetchOnWindowFocus: false,
      },
    )

  useEffect(() => {
    if (content.page && title) {
      setLinkAtom({
        ...(content.page as CollectionLinkProps),
        title,
      })
      setLinkRef((content.page as CollectionLinkProps).ref)
    }
  }, [content?.page, title, setLinkAtom, setLinkRef])

  const updateCollectionLinkMutation =
    trpc.collection.updateCollectionLink.useMutation()

  useEffect(() => {
    if (updateCollectionLinkMutation.isSuccess) {
      void utils.collection.readCollectionLink.invalidate()
      void utils.page.readPage.invalidate()
      toast({
        title: "Link updated!",
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [updateCollectionLinkMutation.isSuccess])

  const savedPageState = {
    ...(content.page as CollectionLinkProps),
    title,
  }
  const handleChange = (data: IsomerLinkSchema) =>
    setLinkAtom(data as CollectionLinkProps)

  return (
    <ErrorProvider>
      <DrawerState
        savedPageState={savedPageState}
        previewPageState={data}
        isLoading={updateCollectionLinkMutation.isLoading}
        handleChange={handleChange}
        handleSaveChanges={() =>
          updateCollectionLinkMutation.mutate({ siteId, linkId, ...data })
        }
      />
    </ErrorProvider>
  )
}
