import { BiDotsHorizontalRounded, BiDotsVerticalRounded } from "react-icons/bi"

export const IconTableDragDots = ({
  orientation,
}: {
  orientation: "vertical" | "horizontal"
}) => {
  const Icon =
    orientation === "vertical" ? BiDotsVerticalRounded : BiDotsHorizontalRounded
  return <Icon aria-hidden />
}
