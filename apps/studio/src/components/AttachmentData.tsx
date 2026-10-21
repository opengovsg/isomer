import { Box, Flex, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { useEffect, useRef, useState } from "react"
import { BiTrash } from "react-icons/bi"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

// Match ImageClient's self-heal: a just-saved/just-uploaded asset isn't servable
// for a window (CDN variant not built / original not malware-scanned yet), so the
// first load can 404/403. Retry the same URL with bounded exponential backoff
// before giving up.
const MAX_THUMBNAIL_RETRIES = 5
const retryDelayMs = (attempt: number) => Math.min(1000 * 2 ** attempt, 16000)

interface AttachmentDataProps {
  data: string
  onClick: () => void
  // When provided, the whole row becomes the image-adjustment entry point: it's
  // clickable (opens the editor) and shows an "Edit image" link under the name.
  // Omitted for non-adjustable attachments (row isn't clickable).
  onEdit?: () => void
  // When provided, renders a small thumbnail at the start of the row. Must be a
  // loadable URL (resolve managed "/..." paths via generateAssetUrl first).
  imageSrc?: string
}
export const AttachmentData = ({
  data,
  onClick,
  onEdit,
  imageSrc,
}: AttachmentDataProps) => {
  // Only self-heal managed CDN assets — an external URL's error is permanent and
  // a cache-bust query could break a signed external URL.
  const canRetry =
    !!imageSrc && ASSETS_BASE_URL !== "" && imageSrc.startsWith(ASSETS_BASE_URL)
  // The src actually requested — bumped with a cache-bust param on each retry so
  // the browser re-fetches (the CDN ignores unknown query params for its cache
  // key, so this doesn't fragment the cache).
  const [currentSrc, setCurrentSrc] = useState(imageSrc)
  const [isLoaded, setIsLoaded] = useState(false)
  const attemptRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Reset when the underlying image changes (the row is reused across uploads).
  useEffect(() => {
    setCurrentSrc(imageSrc)
    setIsLoaded(false)
    attemptRef.current = 0
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [imageSrc])

  return (
    <Flex
      px="1rem"
      py="0.75rem"
      flexDir="row"
      background="brand.primary.100"
      justifyContent="space-between"
      alignItems="center"
      // The whole row is the editor entry point when adjustable; the Remove
      // button below stops propagation so it isn't swallowed by this handler.
      onClick={onEdit}
      cursor={onEdit ? "pointer" : undefined}
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onEdit()
              }
            }
          : undefined
      }
      _hover={onEdit ? { background: "brand.primary.200" } : undefined}
    >
      <HStack spacing="0.75rem" minW={0}>
        {imageSrc && (
          <Box position="relative" boxSize="2.5rem" flexShrink={0}>
            {/* Fading-gray skeleton shown until the image loads — and left in
                place (instead of a broken-image icon) if every retry fails. */}
            {!isLoaded && (
              <Skeleton position="absolute" inset={0} borderRadius="0.25rem" />
            )}
            <Image
              src={currentSrc}
              alt=""
              boxSize="2.5rem"
              objectFit="cover"
              borderRadius="0.25rem"
              // Hide the img until it loads so a failed load reveals the skeleton
              // behind it, never the browser's broken-image glyph.
              opacity={isLoaded ? 1 : 0}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                if (!canRetry || attemptRef.current >= MAX_THUMBNAIL_RETRIES) {
                  return
                }
                const attempt = attemptRef.current
                attemptRef.current = attempt + 1
                const sep = imageSrc.includes("?") ? "&" : "?"
                timeoutRef.current = setTimeout(() => {
                  setCurrentSrc(`${imageSrc}${sep}retry=${attempt + 1}`)
                }, retryDelayMs(attempt))
              }}
            />
          </Box>
        )}
        <VStack align="start" spacing={0} minW={0}>
          <Text
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            w="100%"
          >
            {data.split("/").pop()}
          </Text>
          {onEdit && (
            <Text
              textStyle="caption-2"
              fontWeight="500"
              color="interaction.links.default"
            >
              Edit image
            </Text>
          )}
        </VStack>
      </HStack>
      <HStack spacing={0} flexShrink={0}>
        <IconButton
          size="xs"
          variant="clear"
          colorScheme="critical"
          aria-label="Remove file"
          icon={<BiTrash />}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        />
      </HStack>
    </Flex>
  )
}
