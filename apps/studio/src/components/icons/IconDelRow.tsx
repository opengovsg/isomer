import { chakra } from "@chakra-ui/react"

export const IconDelRow = chakra(
  (props: React.SVGProps<SVGSVGElement>): React.ReactNode => (
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
        d="M18.45 14.7L15.97 17.18L13.5 14.7L12.67 15.53L15.15 18L12.67 20.47L13.5 21.3L15.97 18.82L18.45 21.3L19.27 20.47L16.8 18L19.27 15.53L18.45 14.7Z"
        fill="#2C2E34"
      />
    </svg>
  ),
)
