import type { AvatarProps as ChakraAvatarProps } from "@chakra-ui/react"
import { Avatar as ChakraAvatar } from "@chakra-ui/react"

interface AvatarProps extends Omit<ChakraAvatarProps, "src" | "name"> {
  src?: string | null
  name?: string | null
}

export const Avatar = ({ src, name, ...props }: AvatarProps) => {
  return (
    <ChakraAvatar
      variant="subtle"
      bg="interaction.main-subtle.default"
      src={src ?? ""}
      name={name ?? ""}
      {...props}
    />
  )
}
