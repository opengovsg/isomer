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

import { useBulkCreateRedirects, useBulkValidateRedirects } from "../api"

type BulkValidation = RouterOutput["redirect"]["bulkValidate"]
type FileRejections = NonNullable<AttachmentProps<false>["rejections"]>

// Path to the header-only template shipped as a static public asset.
const TEMPLATE_HREF = "/redirects-template.csv"

// Validation is quick enough that the screen can change before the click
// registers, so a process reads as "nothing happened" — worst on a re-upload
// that lands back on the errors screen, which looks unchanged. Hold the spinner
// to this floor so every run is visible; 2s registers without feeling sluggish.
const MIN_PROCESSING_MS = 2000

// Keyed by react-dropzone's ErrorCode values, inlined rather than imported since
// react-dropzone is the design system's dependency and not one we declare. Same
// voice as the parse-time file errors, since both render in the same place.
const REJECTION_MESSAGES: Record<string, string | undefined> = {
  "file-too-large": `This file is too big. Upload a file under ${formatFileSizeLimit({ bytes: MAX_BULK_REDIRECT_CSV_BYTES })} and try again.`,
  "file-invalid-type":
    "This file isn't a .csv. Upload a .csv file and try again.",
  "too-many-files": "Upload one file at a time.",
}

// First mapped error wins, mirroring the dropzone's own ordering. Falls back to
// the generic unreadable copy so an unmapped code can never leave the file on
// screen with no explanation.
const rejectionMessage = (rejection: FileRejections[number]): string => {
  for (const { code } of rejection.errors) {
    const message = REJECTION_MESSAGES[code]
    if (message !== undefined) return message
  }
  return "We couldn't read this file. Upload a valid .csv file."
}

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
  // Revoke on the next tick, not synchronously after click(): some browsers
  // abort the download if the blob URL is freed before it has started.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const BulkUploadRedirectsModal = ({
  siteId,
  isOpen,
  onClose,
}: BulkUploadRedirectsModalProps): JSX.Element => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { validate } = useBulkValidateRedirects(siteId)
  const { mutateAsync: publish } = useBulkCreateRedirects()

  const [stage, setStage] = useState<Stage>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [csv, setCsv] = useState<string | null>(null)
  // A file-level problem caught in the browser (empty / missing column / too big
  // / not a csv), shown inline under the chip before the user can process.
  const [fileError, setFileError] = useState<string | null>(null)
  const [validation, setValidation] = useState<BulkValidation | null>(null)
  const [showSlowMessage, setShowSlowMessage] = useState(false)
  // Covers the validation request plus MIN_PROCESSING_MS, so the button keeps
  // its spinner for the whole visible wait rather than the request alone.
  const [isProcessing, setIsProcessing] = useState(false)

  // Tracks the most recently picked file. `file.text()` is async, so if the user
  // picks A then B before A finishes reading, A could resolve last — this lets
  // the handler drop the stale read instead of committing A's contents while the
  // chip shows B.
  const latestFileRef = useRef<File | null>(null)
  // react-dropzone reports a rejected file through onRejection and then calls
  // onChange(undefined) in the same event. Set while handling the rejection so
  // that trailing reset can't wipe the chip and message we just put up; the next
  // onChange(undefined) consumes it, so removing the file still clears.
  const hasPendingRejectionRef = useRef(false)

  const resetState = () => {
    setStage("upload")
    setFile(null)
    setCsv(null)
    setFileError(null)
    setValidation(null)
    setShowSlowMessage(false)
    setIsProcessing(false)
    latestFileRef.current = null
    hasPendingRejectionRef.current = false
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
      // The reset that trails a rejection — keep what handleRejection just set.
      if (hasPendingRejectionRef.current) {
        hasPendingRejectionRef.current = false
        return
      }
      latestFileRef.current = null
      setFile(null)
      setCsv(null)
      setFileError(null)
      return
    }
    hasPendingRejectionRef.current = false
    latestFileRef.current = selected
    setFile(selected)
    // Clear the previous file's parsed csv and error synchronously, so nothing
    // stale is shown or processed during the async read below (Process stays
    // disabled until the new csv is parsed).
    setCsv(null)
    setFileError(null)
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

  // Files the dropzone rejects (oversize, wrong type, more than one) never reach
  // onChange, so fold them into the same chip-plus-inline-error the parse checks
  // use. Attachment's own rejection UI keeps the picker open and puts the reason
  // in a dismissable chip, which read as a different component for the same
  // class of problem.
  const handleRejection = (fileRejections: FileRejections) => {
    const rejection = fileRejections[0]
    if (!rejection) return
    hasPendingRejectionRef.current = true
    // Also marks any in-flight read of an earlier file stale, so it can't
    // overwrite this message when it resolves.
    latestFileRef.current = rejection.file
    setFile(rejection.file)
    setCsv(null)
    setFileError(rejectionMessage(rejection))
  }

  // Show the errors screen with a fresh, empty re-upload zone (the design's
  // "re-upload the file with fixes"), so the corrected file can be dropped in.
  const enterErrorsStage = (result: BulkValidation) => {
    setValidation(result)
    setFile(null)
    setCsv(null)
    setFileError(null)
    hasPendingRejectionRef.current = false
    setStage("errors")
  }

  const handleProcess = async () => {
    if (!csv) return
    // Validation is quick, so the Process button's inline spinner is enough —
    // no full-screen stage. Stay put so a failure keeps the file.
    setIsProcessing(true)
    // Started alongside the request rather than after it, so the floor and the
    // validation overlap instead of adding up.
    const loadingFloor = new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_PROCESSING_MS),
    )
    try {
      const result = await validate(csv)
      await loadingFloor
      if (result.fileError !== null || result.errorCount > 0) {
        enterErrorsStage(result)
        return
      }
      setValidation(result)
      setStage("success")
    } catch {
      await loadingFloor
      toast({
        title: "We couldn't check your redirects",
        description: "Please try again.",
        status: "error",
      })
    } finally {
      setIsProcessing(false)
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
      `redirects_errors_${siteId}.csv`,
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
            onFileChange={handleFileChange}
            onRejection={handleRejection}
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
                isLoading={isProcessing}
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
  onFileChange: (selected: File | undefined) => void
  onRejection: (rejections: FileRejections) => void
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
        <Stack spacing="1.5rem">
          <Flex gap="0.5rem">
            <Icon
              as={BiSolidCheckCircle}
              color="utility.feedback.success"
              boxSize="1.25rem"
              mt="0.125rem"
            />
            <Stack spacing="0.25rem">
              <Text textStyle="subhead-2" color="utility.feedback.success">
                All {validRows.length} redirect
                {validRows.length === 1 ? " is" : "s are"} good to go.
              </Text>
              <Text textStyle="body-2" color="base.content.default">
                Clicking ‘Publish {validRows.length} redirect
                {validRows.length === 1 ? "" : "s"}’ will publish them
                immediately.
              </Text>
            </Stack>
          </Flex>
          <Accordion allowToggle reduceMotion>
            <AccordionItem
              border="1px solid"
              borderColor="base.divider.medium"
              borderRadius="0.25rem"
              background="base.canvas.alt"
            >
              <AccordionButton>
                <Text
                  flex="1"
                  textAlign="left"
                  paddingY="1"
                  textStyle="subhead-2"
                >
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
                      gap="1rem"
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
        <Stack spacing="2rem">
          {stage === "errors" && validation ? (
            <Flex gap="0.5rem">
              <Icon
                as={BiSolidError}
                color="utility.feedback.critical"
                boxSize="1.25rem"
              />
              <Stack spacing="1rem" align="flex-start">
                <Text textStyle="subhead-2" color="utility.feedback.critical">
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
                To make sure your redirects are formatted properly, download and
                use the template:
              </Text>
              <Button
                as="a"
                href={TEMPLATE_HREF}
                download
                variant="outline"
                size="xs"
                leftIcon={<BiDownload fontSize="1.25rem" />}
              >
                Download redirects template (.csv)
              </Button>
            </Stack>
          )}

          <Stack spacing="0.5rem">
            {stage === "errors" && (
              <Text textStyle="subhead-2" textColor="base.content.strong">
                Re-upload the file with fixes
              </Text>
            )}
            <Attachment
              name="redirects-csv"
              multiple={false}
              value={file ?? undefined}
              onChange={(selected) => void onFileChange(selected)}
              // `rejections` is deliberately not passed: a rejected file is
              // rendered as the attached chip with its reason in `fileError`
              // below, so Attachment must not also render its own error chip.
              onRejection={onRejection}
              accept={[".csv", "text/csv"]}
              maxSize={MAX_BULK_REDIRECT_CSV_BYTES}
            />
            <Text textStyle="body-2" color="base.content.medium">
              {`Maximum file size: ${formatFileSizeLimit({ bytes: MAX_BULK_REDIRECT_CSV_BYTES })}`}
              <br />
              Accepted file type: .csv
            </Text>
            {fileError && (
              <Text textStyle="body-2" color="utility.feedback.critical">
                {fileError}
              </Text>
            )}
          </Stack>
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
