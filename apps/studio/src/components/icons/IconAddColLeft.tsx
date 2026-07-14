import { chakra } from "@chakra-ui/react"

export const IconAddColLeft = chakra(
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
        <path d="M15 23V1H23V23H15Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M7.00004 7.84619C4.70961 7.84619 2.84619 9.70961 2.84619 12C2.84619 14.2905 4.70961 16.1539 7.00004 16.1539C9.29047 16.1539 11.1539 14.2905 11.1539 12C11.1539 9.70961 9.29047 7.84619 7.00004 7.84619Z"
          fill="white"
        />
        <path
          d="M7.5 9.5H6.5V11.5H4.5V12.5H6.5V14.5H7.5V12.5H9.5V11.5H7.5V9.5Z"
          fill="#2C2E34"
        />
        <path
          d="M7 7C4.243 7 2 9.243 2 12C2 14.757 4.243 17 7 17C9.757 17 12 14.757 12 12C12 9.243 9.757 7 7 7ZM7 16C4.7945 16 3 14.2055 3 12C3 9.7945 4.7945 8 7 8C9.2055 8 11 9.7945 11 12C11 14.2055 9.2055 16 7 16Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
