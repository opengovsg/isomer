import { chakra } from "@chakra-ui/react"

export const IconStepsEyebrow = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        viewBox="0 0 400 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect
          x="0.75"
          y="0.75"
          width="398.5"
          height="74.5"
          rx="6"
          fill="#FFFFFF"
          stroke="#D0D5DD"
          strokeWidth="1.5"
        />
        <text
          x="18"
          y="30"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight="500"
          fill="#5F6B7A"
        >
          1
        </text>
        <text
          x="18"
          y="55"
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
