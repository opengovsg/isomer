import { chakra } from "@chakra-ui/react"

export const IconAddRowBelow = chakra(
  (props: React.SVGProps<SVGSVGElement>): React.ReactNode => {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M23 9L1 9L1 1L23 1V9Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M7.85 18C7.85 20.29 9.71 22.15 12 22.15C14.29 22.15 16.15 20.29 16.15 18C16.15 15.71 14.29 13.85 12 13.85C9.71 13.85 7.85 15.71 7.85 18Z"
          fill="white"
        />
        <path
          d="M9.5 17.5V18.5H11.5V20.5H12.5V18.5H14.5V17.5H12.5V15.5H11.5V17.5H9.5Z"
          fill="#2C2E34"
        />
        <path
          d="M7 18C7 20.76 9.24 23 12 23C14.76 23 17 20.76 17 18C17 15.24 14.76 13 12 13C9.24 13 7 15.24 7 18ZM16 18C16 20.21 14.21 22 12 22C9.79 22 8 20.21 8 18C8 15.79 9.79 14 12 14C14.21 14 16 15.79 16 18Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
