import { chakra } from "@chakra-ui/react"

// 200x102 viewBox for the 2-column image-radio (~195px per option). Content
// sits below the radio indicator, not beside it, and shares baselines with the
// carded variants so the three line up.
export const IconStepsNumeral = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        viewBox="0 0 200 102"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <text
          x="14"
          y="46"
          fontFamily="system-ui, sans-serif"
          fontSize="24"
          fontWeight="600"
          fill="#1B2A4A"
        >
          1
        </text>
        <text
          x="14"
          y="70"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight="600"
          fill="#1B2A4A"
        >
          Check if you are eligible
        </text>
        <text
          x="14"
          y="88"
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
