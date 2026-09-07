import { Icon } from "@chakra-ui/react"
import { BiPlus } from "react-icons/bi"

export const IconTableDragPlus = ({ size }: { size: number }) => (
  <Icon as={BiPlus} aria-hidden boxSize={`${size}px`} color="grey.900" />
)
