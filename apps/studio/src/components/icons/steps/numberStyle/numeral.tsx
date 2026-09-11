import { chakra } from "@chakra-ui/react"

// 200x138 viewBox for the 2-column image-radio (~195px per option).
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
