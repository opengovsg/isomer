import { chakra } from "@chakra-ui/react"

// Content starts at x=48 to clear the radio indicator, which the image-radio
// control absolutely positions 8px from the top-left at 20px across.
export const IconStepsNumeral = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        viewBox="0 0 400 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <text
          x="48"
          y="44"
          fontFamily="system-ui, sans-serif"
          fontSize="30"
          fontWeight="600"
          fill="#1B2A4A"
        >
          1
        </text>
        <text
          x="48"
          y="72"
          fontFamily="system-ui, sans-serif"
          fontSize="14"
          fontWeight="600"
          fill="#1B2A4A"
        >
          Check if you are eligible
        </text>
      </svg>
    )
  },
)
