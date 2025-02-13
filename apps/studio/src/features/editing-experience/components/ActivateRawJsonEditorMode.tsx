import { useEffect, useRef, useState } from "react"
import { Box, Text } from "@chakra-ui/react"

const COMBO: KeyboardEvent["key"][] = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
]

interface ActivateRawJsonEditorModeProps {
  onActivate: () => void
}

// Activate the raw JSON editor mode when a key combo is pressed
export const ActivateRawJsonEditorMode = ({
  onActivate,
}: ActivateRawJsonEditorModeProps) => {
  const [comboIndex, setComboIndex] = useState(0)
  const [showCounter, setShowCounter] = useState(false)

  const counterRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentCombo = COMBO[comboIndex] || ""
      if (event.key.toLowerCase() === currentCombo.toLowerCase()) {
        setComboIndex(comboIndex + 1)
        setShowCounter(true)
        if (counterRef.current) {
          clearTimeout(counterRef.current)
        }
        if (comboIndex < COMBO.length) {
          counterRef.current = setTimeout(() => {
            setShowCounter(false)
          }, 400)
        }
      } else {
        setComboIndex(0)
      }
    }

    if (comboIndex === COMBO.length) {
      onActivate()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [comboIndex, onActivate])

  return (
    <Box
      position="fixed"
      bottom="-3rem"
      right="1.25rem"
      bgGradient="linear(to-r, yellow.500, orange.500, red.600)"
      fontSize="5xl"
      fontWeight="black"
      color="transparent"
      bgClip="text"
      transition="all 0.2s ease-out"
      transform={
        showCounter && comboIndex ? "translateY(-5rem)" : "translateY(0)"
      }
      opacity={comboIndex / 10}
    >
      <Text>{comboIndex === COMBO.length ? "FULL" : comboIndex} COMBO</Text>
    </Box>
  )
}
