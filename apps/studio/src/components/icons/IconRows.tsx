import { chakra } from "@chakra-ui/react"

export const IconRows = chakra((props: React.SVGProps<SVGSVGElement>) => 
  (
    <svg
      width="105"
      height="64"
      viewBox="0 0 105 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="0.5" y="0.5" width="104" height="63" rx="4.5" fill="white" />
      <rect x="0.5" y="0.5" width="104" height="63" rx="4.5" stroke="#E5E5E5" />
      <rect x="1" y="1" width="103" height="62" rx="4" fill="white" />
      <rect x="9" y="10" width="87" height="18" rx="4" fill="#EBEBEB" />
      <rect x="9" y="36" width="87" height="18" rx="4" fill="#EBEBEB" />
      <path
        d="M87.35 21.85L90.21 19L87.35 16.15L86.65 16.85L88.79 19L86.65 21.15L87.35 21.85Z"
        fill="#2C2E34"
      />
      <path
        d="M87.35 47.85L90.21 45L87.35 42.15L86.65 42.85L88.79 45L86.65 47.15L87.35 47.85Z"
        fill="#2C2E34"
      />
    </svg>
  )
)
