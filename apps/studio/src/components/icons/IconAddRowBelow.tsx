import { chakra } from "@chakra-ui/react"

export const IconAddRowBelow = chakra(
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
        <path d="M23 9L1 9L1 1L23 1V9Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M7.84619 18C7.84619 20.2904 9.70961 22.1538 12 22.1538C14.2905 22.1538 16.1539 20.2904 16.1539 18C16.1539 15.7095 14.2905 13.8461 12 13.8461C9.70961 13.8461 7.84619 15.7095 7.84619 18Z"
          fill="white"
        />
        <path
          d="M9.5 17.5V18.5H11.5V20.5H12.5V18.5H14.5V17.5H12.5V15.5H11.5V17.5H9.5Z"
          fill="#2C2E34"
        />
        <path
          d="M7 18C7 20.757 9.243 23 12 23C14.757 23 17 20.757 17 18C17 15.243 14.757 13 12 13C9.243 13 7 15.243 7 18ZM16 18C16 20.2055 14.2055 22 12 22C9.7945 22 8 20.2055 8 18C8 15.7945 9.7945 14 12 14C14.2055 14 16 15.7945 16 18Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
