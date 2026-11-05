import { Box, Flex, Stack, Text } from "@chakra-ui/react"
import { Badge, IconButton, Link } from "@opengovsg/design-system-react"
import { useEffect, useRef, useState } from "react"
import { BiPause, BiPlay } from "react-icons/bi"
import { useHover } from "usehooks-ts"

interface Spotlight {
  id: string
  tabLabel: string
  media: { type: "image"; src: string } | { type: "video"; src: string }
  // Intrinsic width / height of the media so the frame size is stable before metadata loads.
  aspectRatio: number
  badge?: string
  title: string
  description: string
  learnMoreHref: string
}

// Hardcoded login spotlight. Replace these entries (up to 3) when the edition changes.
const SPOTLIGHTS: Spotlight[] = [
  {
    id: "hero-banners",
    tabLabel: "Hero banners",
    media: {
      type: "video",
      src: "/assets/fresh-from-isomer/hero-banners.mp4",
    },
    aspectRatio: 1920 / 1080,
    badge: "New",
    title: "New hero banner styles",
    description:
      "Curve the image edge, surface up to four quick links, or rotate up to four slides with their own images, text and buttons.",
    learnMoreHref:
      "https://support.isomer.gov.sg/en/articles/10390602-editing-your-home-page",
  },
  {
    id: "table-editing",
    tabLabel: "Table editing",
    media: {
      type: "video",
      src: "/assets/fresh-from-isomer/table-editing.mp4",
    },
    aspectRatio: 1920 / 1080,
    badge: "New",
    title: "Tables just got easier to work with",
    description:
      "Pick a size, merge cells, add colours, resize or move columns and edit full screen.",
    learnMoreHref:
      "https://support.isomer.gov.sg/en/articles/10425930-text-block#h_6da533f62d",
  },
  {
    id: "page-history",
    tabLabel: "Page history",
    media: {
      type: "video",
      src: "/assets/fresh-from-isomer/page-history.mp4",
    },
    aspectRatio: 1920 / 1080,
    badge: "New",
    title: "Page history",
    description:
      "See every published version of a page and compare any of them side by side with what's live now — changes highlighted, no guesswork.",
    learnMoreHref:
      "https://support.isomer.gov.sg/en/articles/17673203-viewing-a-page-s-history",
  },
]

export const FreshFromIsomerPanel = (): JSX.Element | null => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isBuffering, setIsBuffering] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaFrameRef = useRef<HTMLDivElement>(null)
  const underlineRef = useRef<HTMLDivElement | null>(null)
  const pausedForHoverRef = useRef(false)
  const isMediaHovered = useHover(mediaFrameRef)
  const active = SPOTLIGHTS[activeIndex]

  useEffect(() => {
    if (active?.media.type !== "video") return

    const video = videoRef.current
    if (!video) return

    if (isMediaHovered) {
      if (video.paused) return
      pausedForHoverRef.current = true
      video.pause()
      return
    }

    if (!pausedForHoverRef.current) return
    pausedForHoverRef.current = false
    void video.play()
  }, [active?.media.type, activeIndex, isMediaHovered])

  useEffect(() => {
    if (!isPlaying || isBuffering || active?.media.type !== "video") return

    const video = videoRef.current
    if (!video) return

    let frame = 0
    const tick = () => {
      const bar = underlineRef.current
      if (bar && Number.isFinite(video.duration) && video.duration > 0) {
        bar.style.width = `${(video.currentTime / video.duration) * 100}%`
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active?.media.type, activeIndex, isBuffering, isPlaying])

  if (!active) return null

  const selectSpotlight = (index: number) => {
    const next = SPOTLIGHTS[index]
    if (!next) return
    pausedForHoverRef.current = false
    setActiveIndex(index)
    setIsPlaying(next.media.type === "video")
    setIsBuffering(next.media.type === "video")
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    pausedForHoverRef.current = false
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  return (
    <Stack spacing="1.25rem" w="100%" maxW="36rem">
      <Flex align="center" justify="space-between" gap="1rem">
        <Flex align="center" gap="0.75rem" minW={0}>
          <Text as="h2" textStyle="h5" color="base.content.strong">
            Fresh from Isomer
          </Text>
          <Badge
            variant="subtle"
            colorScheme="main"
            borderRadius="full"
            flexShrink={0}
          >
            Nov 2026 edition
          </Badge>
        </Flex>

        {active.media.type === "video" && (
          <IconButton
            aria-label={isPlaying ? "Pause" : "Play"}
            variant="clear"
            colorScheme="neutral"
            size="sm"
            icon={isPlaying ? <BiPause /> : <BiPlay />}
            onClick={togglePlayback}
          />
        )}
      </Flex>

      <Flex role="tablist" aria-label="Fresh from Isomer" gap="1.5rem">
        {SPOTLIGHTS.map((item, index) => {
          const isActive = index === activeIndex
          const showProgressBar = isActive && item.media.type === "video"

          return (
            <Box
              as="button"
              type="button"
              key={item.id}
              role="tab"
              id={`fresh-from-isomer-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`fresh-from-isomer-panel-${item.id}`}
              position="relative"
              pb="0.5rem"
              color={isActive ? "base.content.strong" : "base.content.medium"}
              textStyle="subhead-2"
              cursor={isActive ? "default" : "pointer"}
              onClick={() => {
                if (isActive) return
                selectSpotlight(index)
              }}
              _focusVisible={{ boxShadow: "outline", outline: "none" }}
            >
              {item.tabLabel}
              {showProgressBar && (
                <Box
                  ref={(node: HTMLDivElement | null) => {
                    // Ignore null: unmount of a later tab runs after mount of an earlier one and would clear the shared ref.
                    if (node) underlineRef.current = node
                  }}
                  aria-hidden
                  position="absolute"
                  left="0"
                  bottom="0"
                  h="2px"
                  w="0%"
                  bg="interaction.main.default"
                />
              )}
              {isActive && item.media.type === "image" && (
                <Box
                  aria-hidden
                  position="absolute"
                  left="0"
                  bottom="0"
                  h="2px"
                  w="100%"
                  bg="interaction.main.default"
                />
              )}
            </Box>
          )
        })}
      </Flex>

      {SPOTLIGHTS.map((item, index) => {
        const isPanelActive = index === activeIndex

        return (
          <Box
            key={item.id}
            id={`fresh-from-isomer-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`fresh-from-isomer-tab-${item.id}`}
            hidden={!isPanelActive}
            borderRadius="lg"
            overflow="hidden"
            borderWidth="1px"
            borderColor="base.divider.medium"
            boxShadow="md"
            w="100%"
          >
            {isPanelActive && (
              <Box
                ref={mediaFrameRef}
                w="100%"
                aspectRatio={item.aspectRatio}
                position="relative"
                overflow="hidden"
                bg="#ebebeb"
              >
                {item.media.type === "video" ? (
                  <Box
                    key={item.id}
                    as="video"
                    ref={videoRef}
                    src={item.media.src}
                    muted
                    playsInline
                    autoPlay
                    loop={SPOTLIGHTS.length === 1}
                    preload="auto"
                    aria-label={item.title}
                    position="absolute"
                    inset={0}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    display="block"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onEnded={() => {
                      if (SPOTLIGHTS.length > 1) {
                        selectSpotlight((activeIndex + 1) % SPOTLIGHTS.length)
                      }
                    }}
                  />
                ) : (
                  <Box
                    as="img"
                    src={item.media.src}
                    position="absolute"
                    inset={0}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    display="block"
                  />
                )}
              </Box>
            )}
          </Box>
        )
      })}

      <Stack spacing="0.75rem">
        <Flex align="center" gap="0.75rem">
          {active.badge && (
            <Badge
              variant="subtle"
              colorScheme="success"
              borderRadius="full"
              bg="interaction.success-subtle.default"
              border="1px solid"
              borderColor="interaction.success-subtle.hover"
              color="utility.feedback.success"
              flexShrink={0}
            >
              {active.badge}
            </Badge>
          )}
          <Text as="h3" textStyle="h5" color="base.content.strong">
            {active.title}
          </Text>
        </Flex>
        <Text textStyle="body-1" color="base.content.medium">
          {active.description}
        </Text>
        <Link
          href={active.learnMoreHref}
          isExternal
          variant="inline"
          w="fit-content"
        >
          Learn more
        </Link>
      </Stack>
    </Stack>
  )
}
