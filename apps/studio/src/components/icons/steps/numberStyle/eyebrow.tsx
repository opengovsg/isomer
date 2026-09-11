import { chakra } from "@chakra-ui/react"

// Content starts at x=48 to clear the radio indicator, which the image-radio
// control absolutely positions 8px from the top-left at 20px across. The card
// width is measured to hug the sample text rather than stretching the full
// preview, so it reads as a specimen instead of a second full-width box — it
// needs re-measuring if the sample copy changes.
export const IconStepsEyebrow = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        viewBox="0 0 400 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect
          x="40.75"
          y="6.75"
          width="208.5"
          height="94.5"
          rx="8"
          fill="#FFFFFF"
          stroke="#D0D5DD"
          strokeWidth="1.5"
        />
        <text
          x="58"
          y="34"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight="500"
          fill="#5F6B7A"
        >
          1
        </text>
        <text
          x="58"
          y="60"
          fontFamily="system-ui, sans-serif"
          fontSize="14"
          fontWeight="600"
          fill="#1B2A4A"
        >
          Check if you are eligible
        </text>
        <text
          x="58"
          y="84"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fill="#4A5568"
        >
          You must be 21 or above.
        </text>
      </svg>
    )
  },
)
