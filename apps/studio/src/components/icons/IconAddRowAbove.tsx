import { chakra } from "@chakra-ui/react"

export const IconAddRowAbove = chakra(
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
        <path d="M23 23H1L1 15L23 15V23Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M12 2.85C9.71 2.85 7.85 4.71 7.85 7C7.85 9.29 9.71 11.15 12 11.15C14.29 11.15 16.15 9.29 16.15 7C16.15 4.71 14.29 2.85 12 2.85Z"
          fill="white"
        />
        <path
          d="M12.5 4.5H11.5V6.5H9.5V7.5H11.5V9.5H12.5V7.5H14.5V6.5H12.5V4.5Z"
          fill="#2C2E34"
        />
        <path
          d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 11C9.79 11 8 9.21 8 7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7C16 9.21 14.21 11 12 11Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
