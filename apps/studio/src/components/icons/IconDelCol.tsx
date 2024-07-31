import { chakra } from "@chakra-ui/react"

export const IconDelCol = chakra(
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
        <path d="M2 23V1H10V23H2Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M19.4453 4.70068L16.9702 7.17518L14.4957 4.70068L13.6709 5.52552L16.1454 8.00002L13.6709 10.4745L14.4957 11.2994L16.9702 8.82485L19.4453 11.2994L20.2701 10.4745L17.7956 8.00002L20.2701 5.52552L19.4453 4.70068Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
