import { chakra } from "@chakra-ui/react"

export const IconAddColLeft = chakra(
  (props: React.SVGProps<SVGSVGElement>): React.ReactNode => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M15 23V1H23V23H15Z" stroke="#2C2E34" strokeWidth="1.5" />
      <path
        d="M7 7.85C4.71 7.85 2.85 9.71 2.85 12C2.85 14.29 4.71 16.15 7 16.15C9.29 16.15 11.15 14.29 11.15 12C11.15 9.71 9.29 7.85 7 7.85Z"
        fill="white"
      />
      <path
        d="M7.5 9.5H6.5V11.5H4.5V12.5H6.5V14.5H7.5V12.5H9.5V11.5H7.5V9.5Z"
        fill="#2C2E34"
      />
      <path
        d="M7 7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17C9.76 17 12 14.76 12 12C12 9.24 9.76 7 7 7ZM7 16C4.79 16 3 14.21 3 12C3 9.79 4.79 8 7 8C9.21 8 11 9.79 11 12C11 14.21 9.21 16 7 16Z"
        fill="#2C2E34"
      />
    </svg>
  ),
)
