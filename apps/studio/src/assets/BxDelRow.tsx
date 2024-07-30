import { chakra } from "@chakra-ui/react"

export const BxDelRow = chakra(
  (props: React.SVGProps<SVGSVGElement>): JSX.Element => {
    return (
      <svg
        width="24"
        height="25"
        viewBox="0 0 24 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M1 4L23 4V12L1 12V4Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M18.4453 14.7007L15.9702 17.1752L13.4957 14.7007L12.6709 15.5255L15.1454 18L12.6709 20.4745L13.4957 21.2994L15.9702 18.8249L18.4453 21.2994L19.2701 20.4745L16.7956 18L19.2701 15.5255L18.4453 14.7007Z"
          fill="#2C2E34"
        />
      </svg>
    )
  },
)
