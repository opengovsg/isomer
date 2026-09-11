import { chakra } from "@chakra-ui/react"

export const IconStepsNumeral = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        viewBox="0 0 400 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <text
          x="18"
          y="34"
          fontFamily="system-ui, sans-serif"
          fontSize="30"
          fontWeight="600"
          fill="#1B2A4A"
        >
          1
        </text>
        <text
          x="18"
          y="62"
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
