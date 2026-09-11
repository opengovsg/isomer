import { chakra } from "@chakra-ui/react"

// 200x138 viewBox for the 2-column image-radio (~195px per option). 1px stroke
// on half-pixel coords matches the 1px Tailwind border on the real card.
export const IconStepsBadge = chakra((props: React.SVGProps<SVGSVGElement>) => {
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
      <rect x="24" y="46" width="22" height="22" rx="5" fill="#E7ECF5" />
      <text
        x="35"
        y="61"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize="11"
        fontWeight="600"
        fill="#1B2A4A"
      >
        1
      </text>
      <text
        x="24"
        y="92"
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill="#1B2A4A"
      >
        Check if you are eligible
      </text>
      <text
        x="24"
        y="110"
        fontFamily="system-ui, sans-serif"
        fontSize="10.5"
        fill="#4A5568"
      >
        You must be 21 or above.
      </text>
    </svg>
  )
})
