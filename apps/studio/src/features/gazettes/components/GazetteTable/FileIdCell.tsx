import { HStack, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { trpc } from "~/utils/trpc"

interface FileIdCellProps {
  fileId: string
  fileKey: string | null
  siteId: number
}

export const FileIdCell = ({
  fileId,
  fileKey,
  siteId,
}: FileIdCellProps): JSX.Element => {
  const { mutateAsync: getPresignedGetUrl, isPending } =
    trpc.asset.getPresignedGetUrl.useMutation()

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // NOTE: prevent this from reaching the row
    // and showing the modal
    e.preventDefault()
    e.stopPropagation()
    if (!fileKey || isPending) return

    const { presignedGetUrl } = await getPresignedGetUrl({
      siteId,
      fileKey: fileKey.slice(1),
    })
    if (presignedGetUrl) {
      window.open(presignedGetUrl, "_blank")
    }
  }

  if (fileKey) {
    return (
      <HStack spacing="0.25rem" align="center">
        <Link
          href="#"
          onClick={handleClick}
          isExternal
          textStyle="body-2"
          color="interaction.links.default"
          textDecoration="underline"
          p="0"
          aria-disabled={isPending}
          opacity={isPending ? 0.5 : 1}
          pointerEvents={isPending ? "none" : "auto"}
          wordBreak="break-all"
        >
          {fileId}
        </Link>
      </HStack>
    )
  }

  return (
    <Text textStyle="body-2" color="base.content.strong" wordBreak="break-all">
      {fileId}
    </Text>
  )
}
