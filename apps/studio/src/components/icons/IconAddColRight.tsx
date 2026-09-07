import { chakra } from "@chakra-ui/react"

export const IconAddColRight = chakra(
  (props: React.SVGProps<SVGSVGElement>): React.ReactNode => 
    (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M1 23V1H9V23H1Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M17 7.85C14.71 7.85 12.85 9.71 12.85 12C12.85 14.29 14.71 16.15 17 16.15C19.29 16.15 21.15 14.29 21.15 12C21.15 9.71 19.29 7.85 17 7.85Z"
          fill="white"
        />
        <path
          d="M17.5 9.5H16.5V11.5H14.5V12.5H16.5V14.5H17.5V12.5H19.5V11.5H17.5V9.5Z"
          fill="#2C2E34"
        />
        <path
          d="M17 7C14.24 7 12 9.24 12 12C12 14.76 14.24 17 17 17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7ZM17 16C14.79 16 13 14.21 13 12C13 9.79 14.79 8 17 8C19.21 8 21 9.79 21 12C21 14.21 19.21 16 17 16Z"
          fill="#2C2E34"
        />
      </svg>
    )
  ,
)
