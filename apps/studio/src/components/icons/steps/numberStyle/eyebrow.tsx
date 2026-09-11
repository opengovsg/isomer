import { chakra } from "@chakra-ui/react"

// Sized for the two-column image-radio layout, where each option is roughly
// 195px wide, so the 200-unit viewBox renders about 1:1. Content sits below the
// radio indicator rather than beside it. The 1px stroke on half-pixel
// coordinates matches the real card, which uses Tailwind's 1px `border`.
export const IconStepsEyebrow = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        viewBox="0 0 200 138"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect
          x="10.5"
          y="34.5"
          width="179"
          height="94"
          rx="6"
          fill="#FFFFFF"
          stroke="#D0D5DD"
          strokeWidth="1"
        />
        <text
          x="24"
          y="58"
          fontFamily="system-ui, sans-serif"
          fontSize="10"
          fontWeight="500"
          fill="#5F6B7A"
        >
          1
        </text>
        <text
          x="24"
          y="82"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight="600"
          fill="#1B2A4A"
        >
          Check if you are eligible
        </text>
        <text
          x="24"
          y="100"
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
