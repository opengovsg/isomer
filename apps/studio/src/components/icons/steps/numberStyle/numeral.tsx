import { chakra } from "@chakra-ui/react"

// Sized for the two-column image-radio layout, where each option is roughly
// 195px wide, so the 200-unit viewBox renders about 1:1. Content sits below the
// radio indicator rather than beside it — the indicator is a fixed 20px at 8px
// from the top-left, which would eat a tenth of the width at this size.
export const IconStepsNumeral = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        viewBox="0 0 200 138"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <text
          x="14"
          y="66"
          fontFamily="system-ui, sans-serif"
          fontSize="24"
          fontWeight="600"
          fill="#1B2A4A"
        >
          1
        </text>
        <text
          x="14"
          y="92"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight="600"
          fill="#1B2A4A"
        >
          Check if you are eligible
        </text>
        <text
          x="14"
          y="110"
          fontFamily="system-ui, sans-serif"
          fontSize="10.5"
          fill="#4A5568"
        >
          You must be 21 or above.
        </text>
      </svg>
    )
  },
)
