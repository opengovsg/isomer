import type { GetServerSideProps } from "next"
import type { RecipientPreviewProps } from "~/features/previewLink/components/RecipientPreview"
import type { NextPageWithLayout } from "~/lib/types"
import { Box } from "@chakra-ui/react"
import Head from "next/head"
import { PreviewChrome } from "~/features/previewLink/components/PreviewChrome"
import { RecipientPreview } from "~/features/previewLink/components/RecipientPreview"

interface PreviewPageProps extends RecipientPreviewProps {
  pageTitle: string
  expiresAt: string
}

const PreviewPage: NextPageWithLayout<PreviewPageProps> = ({
  pageTitle,
  expiresAt,
  ...renderProps
}) => {
  return (
    <>
      <Head>
        <title>{`Isomer Preview: ${pageTitle}`}</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Head>
      <Box minH="100vh" bg="white">
        <PreviewChrome pageTitle={pageTitle} expiresAt={expiresAt} />
        <RecipientPreview {...renderProps} />
      </Box>
    </>
  )
}

// Recipients are unauthenticated; render the page with no Studio layout chrome.
PreviewPage.getLayout = (page) => page

export const getServerSideProps: GetServerSideProps<PreviewPageProps> = async (
  ctx,
) => {
  const tokenParam = ctx.params?.token
  if (typeof tokenParam !== "string") return { notFound: true }

  ctx.res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet")
  ctx.res.setHeader("Referrer-Policy", "no-referrer")

  const { db, AuditLogEvent } = await import("~/server/modules/database")
  const {
    getFullPageById,
    getNavBar,
    getFooter,
    getLocalisedSitemap,
    getResourceFullPermalink,
  } = await import("~/server/modules/resource/resource.service")
  const { getSiteConfig } = await import("~/server/modules/site/site.service")
  const { logPreviewLinkEvent } = await import(
    "~/server/modules/audit/audit.service"
  )
  const { default: getIP } = await import("~/utils/getClientIp")

  const link = await db
    .selectFrom("PreviewLink")
    .where("token", "=", tokenParam)
    .selectAll()
    .executeTakeFirst()

  if (!link) return { notFound: true }

  // Slice 1 deliberately does not branch on link.revokedAt or link.expiresAt
  // < now() — that behaviour ships with #2484.

  const resourceId = Number(link.resourceId)
  const siteId = link.siteId

  const page = await getFullPageById(db, { resourceId, siteId })
  if (!page) return { notFound: true }

  // Audit the view before rendering. Every refresh = one row (no de-dup).
  await db.transaction().execute(async (tx) => {
    await logPreviewLinkEvent(tx, {
      eventType: AuditLogEvent.PreviewLinkView,
      userId: null,
      siteId,
      ip: getIP(ctx.req),
      delta: { before: null, after: null },
      metadata: { linkId: String(link.id) },
    })
  })

  const [navbar, footer, siteConfig, siteMap, permalink] = await Promise.all([
    getNavBar(db, siteId),
    getFooter(db, siteId),
    getSiteConfig(db, siteId),
    getLocalisedSitemap(siteId, resourceId),
    getResourceFullPermalink(siteId, resourceId),
  ])

  if (!permalink) return { notFound: true }

  return {
    props: {
      pageTitle: page.title,
      expiresAt: link.expiresAt.toISOString(),
      pageContent: page.content as RecipientPreviewProps["pageContent"],
      permalink,
      lastModified:
        page.updatedAt instanceof Date
          ? page.updatedAt.toISOString()
          : new Date().toISOString(),
      siteConfig: siteConfig as Record<string, unknown>,
      navbar: navbar.content,
      footer: footer.content,
      siteMap,
    },
  }
}

export default PreviewPage
