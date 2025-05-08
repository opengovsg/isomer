import { chakra } from "@chakra-ui/react"

export const IconRows = chakra((props: React.SVGProps<SVGSVGElement>) => {
  return (
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
        d="M87.3535 21.8535L90.207 19L87.3535 16.1465L86.6465 16.8535L88.793 19L86.6465 21.1465L87.3535 21.8535Z"
        fill="#2C2E34"
      />
      <path
        d="M87.3535 47.8535L90.207 45L87.3535 42.1465L86.6465 42.8535L88.793 45L86.6465 47.1465L87.3535 47.8535Z"
        fill="#2C2E34"
      />
    </svg>
  )
})
