import type { GetServerSideProps, NextApiRequest } from "next"
import type { RecipientPreviewProps } from "~/features/previewLink/components/RecipientPreview"
import type { NextPageWithLayout } from "~/lib/types"
import { Box } from "@chakra-ui/react"
import Head from "next/head"
import { PreviewChrome } from "~/features/previewLink/components/PreviewChrome"
import { PreviewRateLimited } from "~/features/previewLink/components/PreviewRateLimited"
import { PreviewUnavailable } from "~/features/previewLink/components/PreviewUnavailable"
import { RecipientPreview } from "~/features/previewLink/components/RecipientPreview"

type PreviewPageProps =
  | ({
      status: "available"
      pageTitle: string
      expiresAt: string
    } & RecipientPreviewProps)
  | { status: "unavailable" }
  | { status: "rate-limited" }

const getTitleForStatus = (status: PreviewPageProps["status"]): string => {
  switch (status) {
    case "available":
      return "Isomer Preview"
    case "unavailable":
      return "Preview unavailable"
    case "rate-limited":
      return "Slow down"
  }
}

const PreviewPage: NextPageWithLayout<PreviewPageProps> = (props) => {
  const headTitle =
    props.status === "available"
      ? `Isomer Preview: ${props.pageTitle}`
      : getTitleForStatus(props.status)

  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Head>
      {props.status === "unavailable" ? (
        <PreviewUnavailable />
      ) : props.status === "rate-limited" ? (
        <PreviewRateLimited />
      ) : (
        <Box minH="100vh" bg="white">
          <PreviewChrome
            pageTitle={props.pageTitle}
            expiresAt={props.expiresAt}
          />
          <RecipientPreview
            pageContent={props.pageContent}
            permalink={props.permalink}
            lastModified={props.lastModified}
            siteConfig={props.siteConfig}
            navbar={props.navbar}
            footer={props.footer}
            siteMap={props.siteMap}
          />
        </Box>
      )}
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
  const { logPreviewLinkEvent } =
    await import("~/server/modules/audit/audit.service")
  const { default: getIP } = await import("~/utils/getClientIp")
  const { checkPreviewViewRateLimit } =
    await import("~/server/modules/previewLink/previewLink.service")
  const { prisma } = await import("~/server/prisma")

  const link = await db
    .selectFrom("PreviewLink")
    .where("token", "=", tokenParam)
    .selectAll()
    .executeTakeFirst()

  if (!link) return { notFound: true }

  if (link.revokedAt !== null || link.expiresAt <= new Date()) {
    return { props: { status: "unavailable" } }
  }

  const ip = getIP(ctx.req as NextApiRequest)

  // Rate limit BEFORE audit + fetch. The audit log is the resource we're
  // protecting; over-limit must not write a row. Soft-block UX (friendly page),
  // not HTTP 429.
  const allowed = await checkPreviewViewRateLimit(prisma, ip, String(link.id))
  if (!allowed) return { props: { status: "rate-limited" } }

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
      ip,
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
      status: "available",
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
