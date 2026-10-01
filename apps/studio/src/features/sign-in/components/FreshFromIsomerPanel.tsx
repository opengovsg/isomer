import { Box, Flex, Stack, Text } from "@chakra-ui/react"
import { Badge, IconButton, Link } from "@opengovsg/design-system-react"
import { useEffect, useRef, useState } from "react"
import { BiPause, BiPlay } from "react-icons/bi"

interface Spotlight {
  id: string
  tabLabel: string
  media: { type: "image"; src: string } | { type: "video"; src: string }
  badge?: string
  title: string
  description: string
  learnMoreHref: string
}

// Hardcoded login spotlight. Replace these entries (up to 3) when the edition changes.
const SPOTLIGHTS: Spotlight[] = [
  {
    id: "unpublishing",
    tabLabel: "Unpublishing",
    media: {
      type: "video",
      src: "/assets/fresh-from-isomer/unpublishing.mp4",
    },
    badge: "New",
    title: "Unpublish pages",
    description:
      "Take a page off your live site without deleting it. You can publish it again at any time.",
    learnMoreHref:
      "https://support.isomer.gov.sg/en/articles/17125273-unpublishing",
  },
]

// Matches unpublishing.mp4 so the frame size is stable before metadata loads.
const SPOTLIGHT_MEDIA_ASPECT_RATIO = 1280 / 868

export const FreshFromIsomerPanel = (): JSX.Element | null => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isBuffering, setIsBuffering] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const underlineRef = useRef<HTMLDivElement>(null)
  const active = SPOTLIGHTS[activeIndex]

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
    setActiveIndex(index)
    setIsPlaying(next.media.type === "video")
    setIsBuffering(next.media.type === "video")
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
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
            Sep 2026 edition
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
          const showLoadingBar =
            isActive && item.media.type === "video" && isBuffering && isPlaying
          const showProgressBar =
            isActive && item.media.type === "video" && !showLoadingBar

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
              {showLoadingBar && (
                <Box
                  aria-hidden
                  position="absolute"
                  left="0"
                  bottom="0"
                  h="2px"
                  w="100%"
                  bg="interaction.main.default"
                  transformOrigin="left"
                  sx={{
                    animation:
                      "freshFromIsomerLoading 1.2s ease-in-out infinite",
                    "@keyframes freshFromIsomerLoading": {
                      "0%": { transform: "scaleX(0.2)" },
                      "50%": { transform: "scaleX(1)" },
                      "100%": { transform: "scaleX(0.2)" },
                    },
                  }}
                />
              )}
              {showProgressBar && (
                <Box
                  ref={underlineRef}
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

      <Box
        id={`fresh-from-isomer-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`fresh-from-isomer-tab-${active.id}`}
        borderRadius="lg"
        overflow="hidden"
        borderWidth="1px"
        borderColor="base.divider.medium"
        boxShadow="md"
        w="100%"
      >
        <Box
          w="100%"
          aspectRatio={SPOTLIGHT_MEDIA_ASPECT_RATIO}
          position="relative"
          overflow="hidden"
          bg="#ebebeb"
        >
          {active.media.type === "video" ? (
            <Box
              key={active.id}
              as="video"
              ref={videoRef}
              src={active.media.src}
              muted
              playsInline
              autoPlay
              loop={SPOTLIGHTS.length === 1}
              preload="auto"
              aria-label={active.title}
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
              src={active.media.src}
              position="absolute"
              inset={0}
              w="100%"
              h="100%"
              objectFit="cover"
              display="block"
            />
          )}
        </Box>
      </Box>

      <Stack spacing="0.75rem">
        <Flex align="center" gap="0.75rem">
          {active.badge && (
            <Badge
              variant="subtle"
              colorScheme="success"
              borderRadius="full"
              bg="transparent"
              border="1px solid"
              borderColor="utility.feedback.success"
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
          variant="standalone"
          w="fit-content"
        >
          Learn more
        </Link>
      </Stack>
    </Stack>
  )
}
