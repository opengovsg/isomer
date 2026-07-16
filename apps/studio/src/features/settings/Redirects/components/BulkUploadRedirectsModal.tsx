import type { AttachmentProps } from "@opengovsg/design-system-react"
import type { RouterOutput } from "~/utils/trpc"
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Center,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Attachment, Button, useToast } from "@opengovsg/design-system-react"
import { useEffect, useRef, useState } from "react"
import {
  BiDownload,
  BiRightArrowAlt,
  BiSolidCheckCircle,
  BiSolidError,
} from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { buildRedirectErrorsCsv, parseRedirectCsv } from "~/lib/redirectCsv"
import { MAX_BULK_REDIRECT_CSV_BYTES } from "~/schemas/redirect"
import { formatFileSizeLimit } from "~/utils/formatFileSizeLimit"
import { trpc } from "~/utils/trpc"

import { useBulkCreateRedirects, useBulkValidateRedirects } from "../api"

type BulkValidation = RouterOutput["redirect"]["bulkValidate"]

// Path to the header-only template shipped as a static public asset.
const TEMPLATE_HREF = "/redirects-template.csv"

interface BulkUploadRedirectsModalProps {
  siteId: number
  isOpen: boolean
  onClose: () => void
}

// The modal walks through: pick a file → process (validate) → either fix errors
// and re-upload, or review and publish the whole batch. `stage` tracks which of
// those the user is on; validation holds the server's per-row verdicts.
// Validation is quick, so its spinner rides on the Process button; publishing
// the batch is the slow step, so it gets the full-screen "publishing" stage.
type Stage = "upload" | "publishing" | "errors" | "success"

const triggerCsvDownload = (filename: string, contents: string) => {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

// A site name can contain characters that are invalid or surprising in a
// download filename (slashes, colons, newlines), so reduce it to a safe slug.
const toFilenameSlug = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "site"

export const BulkUploadRedirectsModal = ({
  siteId,
  isOpen,
  onClose,
}: BulkUploadRedirectsModalProps): JSX.Element => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { validate, isPending: isValidating } = useBulkValidateRedirects(siteId)
  const { mutateAsync: publish } = useBulkCreateRedirects()
  // Site display name (Site config `siteName`), used to name the errors file.
  const { data: site } = trpc.site.getSiteName.useQuery({ siteId })

  const [stage, setStage] = useState<Stage>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [csv, setCsv] = useState<string | null>(null)
  // A file-level problem caught in the browser (empty / missing column), shown
  // inline under the chip before the user can process.
  const [fileError, setFileError] = useState<string | null>(null)
  const [validation, setValidation] = useState<BulkValidation | null>(null)
  const [showSlowMessage, setShowSlowMessage] = useState(false)
  // Oversize / wrong-type files rejected by the dropzone; surfaced by Attachment.
  const [rejections, setRejections] = useState<
    AttachmentProps<false>["rejections"]
  >([])

  // Tracks the most recently picked file. `file.text()` is async, so if the user
  // picks A then B before A finishes reading, A could resolve last — this lets
  // the handler drop the stale read instead of committing A's contents while the
  // chip shows B.
  const latestFileRef = useRef<File | null>(null)

  const resetState = () => {
    setStage("upload")
    setFile(null)
    setCsv(null)
    setFileError(null)
    setValidation(null)
    setShowSlowMessage(false)
    setRejections([])
    latestFileRef.current = null
  }

  // Start fresh every time the modal opens, so a previous run's file or errors
  // never linger.
  useEffect(() => {
    if (isOpen) resetState()
  }, [isOpen])

  // Only show the "this might take a while" line once publishing runs long, per
  // the design ("if it's quick, don't show the second message").
  useEffect(() => {
    if (stage !== "publishing") {
      setShowSlowMessage(false)
      return
    }
    const timer = setTimeout(() => setShowSlowMessage(true), 3000)
    return () => clearTimeout(timer)
  }, [stage])

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileChange = async (selected: File | undefined) => {
    if (!selected) {
      latestFileRef.current = null
      setFile(null)
      setCsv(null)
      setFileError(null)
      return
    }
    latestFileRef.current = selected
    setFile(selected)
    try {
      const text = await selected.text()
      // A newer file was picked while this one was being read — drop the stale
      // result so the parsed csv can't disagree with the chip.
      if (latestFileRef.current !== selected) return
      setCsv(text)
      setFileError(parseRedirectCsv(text).fileError ?? null)
    } catch {
      if (latestFileRef.current !== selected) return
      setCsv(null)
      setFileError("We couldn't read this file. Upload a valid .csv file.")
    }
  }

  // Show the errors screen with a fresh, empty re-upload zone (the design's
  // "re-upload the file with fixes"), so the corrected file can be dropped in.
  const enterErrorsStage = (result: BulkValidation) => {
    setValidation(result)
    setFile(null)
    setCsv(null)
    setFileError(null)
    setRejections([])
    setStage("errors")
  }

  const handleProcess = async () => {
    if (!csv) return
    // Validation is quick, so the Process button's inline spinner (isValidating)
    // is enough — no full-screen stage. Stay put so a failure keeps the file.
    try {
      const result = await validate(csv)
      if (result.fileError !== null || result.errorCount > 0) {
        enterErrorsStage(result)
        return
      }
      setValidation(result)
      setStage("success")
    } catch {
      toast({
        title: "We couldn't check your redirects",
        description: "Please try again.",
        status: "error",
      })
    }
  }

  const handlePublish = async () => {
    if (!csv) return
    // Creating the batch and republishing the site is the slow step, so switch
    // to the full-screen spinner once the user commits.
    setStage("publishing")
    try {
      const result = await publish({ siteId, csv })
      if (result.ok) {
        toast({
          title: `${result.publishedCount} redirect${result.publishedCount === 1 ? "" : "s"} published`,
          status: "success",
        })
        handleClose()
        return
      }
      // A race since the preview made the batch invalid — show the errors screen
      // with the fresh verdicts.
      enterErrorsStage(result.validation)
    } catch {
      toast({
        title: "We couldn't publish your redirects",
        description: "Please try again.",
        status: "error",
      })
      // Back to the review screen so the user can retry the publish.
      setStage("success")
    }
  }

  const handleDownloadErrors = () => {
    if (!validation) return
    triggerCsvDownload(
      `redirects_errors_${toFilenameSlug(site?.name ?? "site")}.csv`,
      buildRedirectErrorsCsv(validation.rows),
    )
  }

  const isProcessDisabled = !file || !!fileError || !csv
  const validRows = validation?.rows.filter((row) => row.error === null) ?? []

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{modalTitle(stage)}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <BulkUploadModalBody
            stage={stage}
            showSlowMessage={showSlowMessage}
            validation={validation}
            validRows={validRows}
            file={file}
            fileError={fileError}
            rejections={rejections}
            onFileChange={handleFileChange}
            onRejection={setRejections}
            onDownloadErrors={handleDownloadErrors}
          />
        </ModalBody>

        {stage !== "publishing" && (
          <ModalFooter>
            {stage === "success" ? (
              <Button onClick={() => void handlePublish()}>
                Publish {validRows.length} redirect
                {validRows.length === 1 ? "" : "s"}
              </Button>
            ) : (
              <Button
                onClick={() => void handleProcess()}
                isDisabled={isProcessDisabled}
                isLoading={isValidating}
              >
                {isProcessDisabled
                  ? "Upload file to continue"
                  : "Process redirects"}
              </Button>
            )}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  )
}

interface BulkUploadModalBodyProps {
  stage: Stage
  showSlowMessage: boolean
  validation: BulkValidation | null
  validRows: BulkValidation["rows"]
  file: File | null
  fileError: string | null
  rejections: AttachmentProps<false>["rejections"]
  onFileChange: (selected: File | undefined) => void
  onRejection: (rejections: AttachmentProps<false>["rejections"]) => void
  onDownloadErrors: () => void
}

// Renders the body for the modal's current stage. A switch (not a ternary
// chain) so each stage reads as its own branch and the union stays exhaustive.
const BulkUploadModalBody = ({
  stage,
  showSlowMessage,
  validation,
  validRows,
  file,
  fileError,
  rejections,
  onFileChange,
  onRejection,
  onDownloadErrors,
}: BulkUploadModalBodyProps): JSX.Element => {
  switch (stage) {
    case "publishing":
      return (
        <Center flexDir="column" py="2.5rem" gap="1rem">
          <Spinner />
          <Stack spacing="0.25rem" textAlign="center">
            <Text textStyle="body-2">
              Publishing your redirects to your site...
            </Text>
            {showSlowMessage && (
              <Text textStyle="body-2" color="base.content.medium">
                This might take a while.
              </Text>
            )}
          </Stack>
        </Center>
      )
    case "success":
      return (
        <Stack spacing="1rem">
          <Flex gap="0.5rem">
            <Icon
              as={BiSolidCheckCircle}
              color="utility.feedback.success"
              boxSize="1.25rem"
              mt="0.125rem"
            />
            <Stack spacing="0.25rem">
              <Text textStyle="subhead-2">
                All {validRows.length} redirect
                {validRows.length === 1 ? " is" : "s are"} good to go.
              </Text>
              <Text textStyle="body-2" color="base.content.medium">
                Clicking &lsquo;Publish {validRows.length} redirect
                {validRows.length === 1 ? "" : "s"}&rsquo; will publish them
                immediately.
              </Text>
            </Stack>
          </Flex>
          <Accordion allowToggle reduceMotion>
            <AccordionItem
              border="1px solid"
              borderColor="base.divider.medium"
              borderRadius="0.25rem"
            >
              <AccordionButton>
                <Text flex="1" textAlign="left" textStyle="subhead-2">
                  Redirects to be added
                </Text>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel maxH="12rem" overflowY="auto">
                <Stack spacing="0.5rem">
                  {validRows.map((row) => (
                    <Flex
                      key={row.rowNumber}
                      align="center"
                      gap="0.5rem"
                      textStyle="body-2"
                    >
                      <Text flex="1" noOfLines={1} title={row.source}>
                        {row.source}
                      </Text>
                      <Icon as={BiRightArrowAlt} flexShrink={0} />
                      <Text flex="1" noOfLines={1} title={row.destination}>
                        {row.destination}
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Stack>
      )
    case "upload":
    case "errors":
      // "upload" and "errors" share the same picker; the error banner and
      // template-vs-errors-file download are the only differences.
      return (
        <Stack spacing="1rem">
          {stage === "errors" && validation ? (
            <Flex gap="0.5rem">
              <Icon
                as={BiSolidError}
                color="utility.feedback.critical"
                boxSize="1.25rem"
                mt="0.125rem"
              />
              <Stack spacing="0.5rem" align="flex-start">
                <Text textStyle="body-2" color="utility.feedback.critical">
                  {errorBannerText(validation)}
                </Text>
                {validation.fileError === null && (
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<BiDownload fontSize="1rem" />}
                    onClick={onDownloadErrors}
                  >
                    Download errors file (.csv)
                  </Button>
                )}
              </Stack>
            </Flex>
          ) : (
            <Stack spacing="0.75rem" align="flex-start">
              <Text textStyle="body-2">
                To make sure your redirects are formatted properly, list your
                redirects on the redirects template:
              </Text>
              <Button
                as="a"
                href={TEMPLATE_HREF}
                download
                variant="outline"
                leftIcon={<BiDownload fontSize="1.25rem" />}
              >
                Download redirects template (.csv)
              </Button>
            </Stack>
          )}

          {stage === "errors" && (
            <Text textStyle="subhead-2">Re-upload the file with fixes</Text>
          )}

          <Stack spacing="0.5rem">
            <Attachment
              name="redirects-csv"
              multiple={false}
              value={file ?? undefined}
              onChange={(selected) => void onFileChange(selected)}
              rejections={rejections}
              onRejection={onRejection}
              accept={[".csv", "text/csv"]}
              maxSize={MAX_BULK_REDIRECT_CSV_BYTES}
            />
            <Text textStyle="body-2" color="base.content.medium">
              {`Maximum file size: ${formatFileSizeLimit({ bytes: MAX_BULK_REDIRECT_CSV_BYTES })}`}
              <br />
              Accepted file type: .csv
            </Text>
          </Stack>
          {fileError && (
            <Text textStyle="body-2" color="utility.feedback.critical">
              {fileError}
            </Text>
          )}
        </Stack>
      )
  }
}

const modalTitle = (stage: Stage): string => {
  switch (stage) {
    case "publishing":
      return "Publishing your redirects"
    case "errors":
      return "There are errors in your redirects"
    case "success":
      return "Redirects are ready to publish"
    case "upload":
      return "Bulk upload redirects"
  }
}

const errorBannerText = (validation: BulkValidation): string => {
  if (validation.fileError !== null) {
    return validation.fileError
  }
  const count = validation.errorCount
  return `${count} redirect${count === 1 ? " has" : "s have"} errors. Download the errors file and correct them before re-uploading:`
}
