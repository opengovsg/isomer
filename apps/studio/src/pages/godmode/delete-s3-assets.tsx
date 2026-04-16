import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Text,
} from "@chakra-ui/react"
import { Textarea, useToast } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { type NextPageWithLayout } from "~/lib/types"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

const GodModeDeleteS3AssetsPage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })

  const [assetsToDeleteText, setAssetsToDeleteText] = useState("")

  const assetsToDelete = assetsToDeleteText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  const deleteAssetsMutation = trpc.asset.deleteAssets.useMutation({
    onSuccess: (data) => {
      toast({
        title: `Successfully deleted assets`,
        description: `Invalidated site(s) - invalidation id: ${data.invalidatedSites.invalidationId}`,
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
      setAssetsToDeleteText("")
    },
    onError: (error) => {
      toast({
        title: "Failed to delete assets",
        description: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  useEffect(() => {
    if (!isUserIsomerAdmin) {
      toast({
        title: "You do not have permission to access this page.",
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
      void router.push(`/`)
    }
  }, [isUserIsomerAdmin, router, toast])

  if (!isUserIsomerAdmin) {
    return null
  }

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" as={NextLink}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/godmode" as={NextLink}>
            👁️ God Mode 👁️
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Text as="h3" size="lg" textStyle="h3">
        Delete S3 assets
      </Text>

      <Box mt={8} bg="white" borderRadius="md" p={4}>
        <Text fontWeight="bold" mb={4}>
          What's the expected format here?
        </Text>
        <Text>
          Input on each line, the path of the asset to delete. This is, for
          example,{" "}
          <code>1/b67d3be2-12b3-4640-a042-5e2b905c9b3e/picture.png</code>.{" "}
          <br />
          <br />
          If there are trailing parameters like `?original=true`, <b>
            delete
          </b>{" "}
          them before submitting
        </Text>
      </Box>

      <Flex flexDir="column" mt={8} bg="white" borderRadius="md" p={4} gap={4}>
        <h1>
          <b>List of assets</b>
        </h1>
        <Textarea
          value={assetsToDeleteText}
          onChange={(e) => setAssetsToDeleteText(e.target.value)}
        />
        <Button
          onClick={() => {
            if (assetsToDelete.length === 0) return
            deleteAssetsMutation.mutate({ fileKeys: assetsToDelete })
          }}
          isLoading={deleteAssetsMutation.isPending}
          isDisabled={assetsToDelete.length === 0}
        >
          Submit
        </Button>
      </Flex>
    </Flex>
  )
}

GodModeDeleteS3AssetsPage.getLayout = AuthenticatedLayout

export default GodModeDeleteS3AssetsPage
