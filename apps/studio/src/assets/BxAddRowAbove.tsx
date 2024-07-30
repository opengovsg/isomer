import { chakra } from "@chakra-ui/react"

export const BxAddRowAbove = chakra(
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
        <path d="M23 23H1L1 15L23 15V23Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M12 2.84619C9.70961 2.84619 7.84619 4.70961 7.84619 7.00004C7.84619 9.29047 9.70961 11.1539 12 11.1539C14.2905 11.1539 16.1539 9.29047 16.1539 7.00004C16.1539 4.70961 14.2905 2.84619 12 2.84619Z"
          fill="white"
        />
        <path
          d="M12.5 4.5H11.5V6.5H9.5V7.5H11.5V9.5H12.5V7.5H14.5V6.5H12.5V4.5Z"
          fill="#2C2E34"
        />
        <path
          d="M12 2C9.243 2 7 4.243 7 7C7 9.757 9.243 12 12 12C14.757 12 17 9.757 17 7C17 4.243 14.757 2 12 2ZM12 11C9.7945 11 8 9.2055 8 7C8 4.7945 9.7945 3 12 3C14.2055 3 16 4.7945 16 7C16 9.2055 14.2055 11 12 11Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
