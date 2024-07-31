import { chakra } from "@chakra-ui/react"

export const IconAddColRight = chakra(
  (props: React.SVGProps<SVGSVGElement>): JSX.Element => {
    return (
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
          d="M17 7.84619C14.7096 7.84619 12.8462 9.70961 12.8462 12C12.8462 14.2905 14.7096 16.1539 17 16.1539C19.2905 16.1539 21.1539 14.2905 21.1539 12C21.1539 9.70961 19.2905 7.84619 17 7.84619Z"
          fill="white"
        />
        <path
          d="M17.5 9.5H16.5V11.5H14.5V12.5H16.5V14.5H17.5V12.5H19.5V11.5H17.5V9.5Z"
          fill="#2C2E34"
        />
        <path
          d="M17 7C14.243 7 12 9.243 12 12C12 14.757 14.243 17 17 17C19.757 17 22 14.757 22 12C22 9.243 19.757 7 17 7ZM17 16C14.7945 16 13 14.2055 13 12C13 9.7945 14.7945 8 17 8C19.2055 8 21 9.7945 21 12C21 14.2055 19.2055 16 17 16Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
