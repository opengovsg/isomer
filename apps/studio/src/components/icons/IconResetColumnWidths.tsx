import { chakra } from "@chakra-ui/react"

export const IconResetColumnWidths = chakra(
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
        <path
          d="M3.75 10.25H8.25V20.25H3.75V10.25Z"
          stroke="#2C2E34"
          strokeWidth="1.5"
        />
        <path
          d="M9.75 10.25H14.25V20.25H9.75V10.25Z"
          stroke="#2C2E34"
          strokeWidth="1.5"
        />
        <path
          d="M15.75 10.25H20.25V20.25H15.75V10.25Z"
          stroke="#2C2E34"
          strokeWidth="1.5"
        />
        <path
          d="M16.75 6.75V4.25H19.25"
          stroke="#2C2E34"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.4 4.55C15.2 3.15 13.45 2.25 11.5 2.25C8.05 2.25 5.25 5.05 5.25 8.5"
          stroke="#2C2E34"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  },
)
