import type { IsomerComponent, IsomerSchema } from "@opengovsg/isomer-components"
import type { ChangeEvent } from "react"
import {
  Box,
  Button,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { useRef, useState } from "react"
import { BiFile, BiSolidError, BiUpload } from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

import { pageSchema } from "../schema"

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const ACCEPTED_EXTENSIONS = ".pdf,.docx"

// TODO: replace with best-practice heuristics once AI integration is wired up
function buildPlaceholderBlocks(layout: string): IsomerComponent[] {
  const blocks: IsomerComponent[] = [
    {
      type: "prose",
      content: [
        {
          type: "heading",
          attrs: { id: "introduction", level: 2 },
          content: [{ type: "text", text: "Introduction" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Replace this placeholder with your actual content. The AI generation feature will populate this with content from your uploaded document.",
            },
          ],
        },
      ],
    },
    {
      type: "accordion",
      summary: "Frequently asked question",
      details: {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Answer placeholder — edit to match your document." },
            ],
          },
        ],
      },
    },
  ]

  if (layout === "content" || layout === "index") {
    blocks.push({
      type: "callout",
      content: {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Important note placeholder — edit to match your document." },
            ],
          },
        ],
      },
    })
  }

  return blocks
}

interface GenerateFromDocumentModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalState = "idle" | "loading" | "error"

export const GenerateFromDocumentModal = ({
  isOpen,
  onClose,
}: GenerateFromDocumentModalProps) => {
  const {
    savedPageState,
    setSavedPageState,
    setPreviewPageState,
    setShowAiShimmer,
  } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(pageSchema)
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [modalState, setModalState] = useState<ModalState>("idle")

  const utils = trpc.useUtils()
  const { mutate: savePageBlob } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
  })

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFileError(null)
    setFile(null)

    if (!selected) return

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError("Only .pdf and .docx files are accepted.")
      return
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File is too large. Maximum size is 10 MB.")
      return
    }

    setFile(selected)
  }

  const handleGenerate = async () => {
    if (!file) return

    setModalState("loading")

    try {
      // Simulate generation delay — replace this block with real AI call
      await new Promise<void>((resolve) => setTimeout(resolve, 2500))

      const newBlocks = buildPlaceholderBlocks(savedPageState.layout)
      const newPageState: IsomerSchema = {
        ...savedPageState,
        content: newBlocks,
      }

      // Apply to preview and saved state
      setPreviewPageState(newPageState)
      setSavedPageState(newPageState)

      // Persist to server
      savePageBlob({
        pageId,
        siteId,
        content: JSON.stringify(newPageState),
      })

      // Trigger shimmer on preview panel
      setShowAiShimmer(true)
      setTimeout(() => setShowAiShimmer(false), 1800)

      onClose()
      handleReset()

      toast({
        status: "warning",
        title: "Generated first draft. Check your work before publishing.",
        ...BRIEF_TOAST_SETTINGS,
      })
    } catch {
      setModalState("error")
    }
  }

  const handleReset = () => {
    setFile(null)
    setFileError(null)
    setModalState("idle")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleClose = () => {
    onClose()
    handleReset()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Generate page from document</ModalHeader>

        <ModalBody>
          {modalState === "loading" ? (
            <VStack spacing="1rem" py="2rem">
              <Spinner
                size="lg"
                color="interaction.main.default"
                thickness="3px"
              />
              <Text textStyle="body-2" color="base.content.medium">
                Building your page…
              </Text>
            </VStack>
          ) : modalState === "error" ? (
            <VStack spacing="1rem" py="1rem">
              <Icon
                as={BiSolidError}
                boxSize="2.5rem"
                color="utility.feedback.critical"
              />
              <VStack spacing="0.25rem">
                <Text textStyle="subhead-2" color="base.content.default">
                  Something went wrong
                </Text>
                <Text textStyle="body-2" color="base.content.medium">
                  We couldn't generate your page. Please try again.
                </Text>
              </VStack>
              <Button
                variant="outline"
                onClick={() => setModalState("idle")}
                size="sm"
              >
                Try again
              </Button>
            </VStack>
          ) : (
            <VStack spacing="1rem" align="start">
              <Text textStyle="body-2" color="base.content.medium">
                Upload a <strong>.pdf</strong> or <strong>.docx</strong> file
                (max 10 MB). We'll use the document's content to build a first
                draft of your page.
              </Text>

              {/* File drop zone */}
              <Box
                as="label"
                htmlFor="doc-upload"
                w="100%"
                border="2px dashed"
                borderColor={
                  fileError
                    ? "utility.feedback.critical"
                    : file
                      ? "interaction.main.default"
                      : "base.divider.medium"
                }
                borderRadius="md"
                p="1.5rem"
                cursor="pointer"
                _hover={{ borderColor: "interaction.main.default" }}
                transition="border-color 0.15s"
              >
                <VStack spacing="0.5rem">
                  <Icon
                    as={file ? BiFile : BiUpload}
                    boxSize="1.75rem"
                    color={
                      file
                        ? "interaction.main.default"
                        : "base.content.medium"
                    }
                  />
                  {file ? (
                    <Text
                      textStyle="body-2"
                      color="interaction.main.default"
                      textAlign="center"
                      noOfLines={1}
                    >
                      {file.name}
                    </Text>
                  ) : (
                    <Text
                      textStyle="body-2"
                      color="base.content.medium"
                      textAlign="center"
                    >
                      Click to select a file
                    </Text>
                  )}
                </VStack>
                <input
                  id="doc-upload"
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Box>

              {fileError && (
                <Flex align="center" gap="0.5rem">
                  <Icon
                    as={BiSolidError}
                    color="utility.feedback.critical"
                    boxSize="1rem"
                    flexShrink={0}
                  />
                  <Text textStyle="caption-2" color="utility.feedback.critical">
                    {fileError}
                  </Text>
                </Flex>
              )}
            </VStack>
          )}
        </ModalBody>

        {modalState !== "loading" && modalState !== "error" && (
          <ModalFooter gap="0.75rem">
            <Button variant="clear" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              isDisabled={!file || !!fileError}
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  )
}
