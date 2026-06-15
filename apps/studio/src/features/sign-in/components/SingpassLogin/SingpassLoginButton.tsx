import { Box } from "@chakra-ui/react"
import { Button } from "@opengovsg/oui"
import { useRouter } from "next/router"
import { SingpassFullLogo } from "~/components/Svg/SingpassFullLogo"
import { SIGN_IN } from "~/lib/routes"
import { trpc } from "~/utils/trpc"
import { getRedirectUrl } from "~/utils/url"

export const SingpassLoginButton = (): JSX.Element | null => {
  const router = useRouter()
  const singpassLoginMutation = trpc.auth.singpass.login.useMutation({
    onSuccess: async ({ redirectUrl }) => {
      await router.push(redirectUrl)
    },
    onError: async (error) => {
      await router.push(`${SIGN_IN}?error=${error.message}`)
    },
  })

  const landingUrl = getRedirectUrl(router.query)

  const handleSingpassLogin = () => {
    return singpassLoginMutation.mutate({
      landingUrl,
    })
  }

  return (
    <Button
      size="sm"
      variant="clear"
      className="h-11 w-full gap-0 whitespace-pre-wrap bg-[#F4333D] text-white hover:bg-[#B0262D] disabled:bg-[#F4333D]"
      isPending={singpassLoginMutation.isPending}
      onPress={handleSingpassLogin}
      aria-label="Authenticate with Singpass"
    >
      Authenticate with{" "}
      {/* Negative margin so the svg sits on the same line as the text */}
      <Box mb="-3px">
        <SingpassFullLogo height="1rem" />
      </Box>
    </Button>
  )
}
