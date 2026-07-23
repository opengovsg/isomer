import { Icon, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { BiLinkExternal } from "react-icons/bi"
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
    trpc.gazette.getPresignedGetUrl.useMutation()

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
      <Link
        as="button"
        type="button"
        onClick={handleClick}
        textStyle="body-2"
        color="interaction.links.default"
        textDecoration="underline"
        p="0"
        aria-disabled={isPending}
        opacity={isPending ? 0.5 : 1}
        pointerEvents={isPending ? "none" : "auto"}
        display="inline-flex"
        alignItems="baseline"
        gap="0.25rem"
      >
        <Text as="span" wordBreak="break-all">
          {fileId}
        </Text>
        <Icon
          as={BiLinkExternal}
          flexShrink={0}
          position="relative"
          top="0.125rem"
          aria-hidden
        />
      </Link>
    )
  }

  return (
    <Text textStyle="body-2" color="base.content.strong" wordBreak="break-all">
      {fileId}
    </Text>
  )
}
