import type { IconType } from "react-icons"
import type { LinkHubLinkProps, LinkHubProps } from "~/interfaces"
import {
  BiDownload,
  BiFile,
  BiLink,
  BiLinkExternal,
  BiMailSend,
  BiPhoneCall,
  BiRightArrowAlt,
} from "react-icons/bi"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { Link } from "../../internal/Link"
import { Prose } from "../../native/Prose"
import { getFileNameFromHref, getLinkHubLinkType } from "./utils"

// NOTE: Card icon covers "external" and "internal" link types with a single
// generic "link" glyph; only the CTA distinguishes between the two.
const CARD_ICONS: Record<ReturnType<typeof getLinkHubLinkType>, IconType> = {
  file: BiFile,
  external: BiLink,
  internal: BiLink,
  email: BiMailSend,
  tel: BiPhoneCall,
}

const CTAS: Record<
  ReturnType<typeof getLinkHubLinkType>,
  { text: string; Icon: IconType }
> = {
  file: { text: "Download", Icon: BiDownload },
  external: { text: "Visit", Icon: BiLinkExternal },
  internal: { text: "Visit", Icon: BiRightArrowAlt },
  email: { text: "Email", Icon: BiLinkExternal },
  tel: { text: "Call", Icon: BiLinkExternal },
}

const linkHubStyles = tv({
  slots: {
    root: "flex flex-col gap-5 [&:not(:first-child)]:mt-7",
    title: "prose-title-md-semibold text-base-content-strong",
    list: "flex flex-col gap-3",
    card: "group flex items-center justify-between gap-4 rounded-lg border-[1.5px] border-base-divider-medium bg-[#F8F9FB] px-5 py-4 hover:border-[#4675E5] hover:bg-[#E6ECF9]",
    cardMain: "flex items-center gap-4",
    cardIcon: "h-6 w-6 flex-shrink-0 text-brand-interaction",
    cardText: "flex flex-col gap-1",
    cardTitle:
      "prose-headline-base-semibold text-base-content group-hover:text-link-hover group-hover:underline",
    cardDetail: "prose-label-md-regular text-base-content-light",
    cta: "flex flex-shrink-0 items-center gap-2",
    ctaText:
      "prose-label-md-medium text-base-content group-hover:text-link-hover group-hover:underline",
    ctaIcon: "h-4 w-4 text-base-content group-hover:text-link-hover",
  },
})

// TODO: Wire up file size for file links (requires a client-side fetch,
// following the DownloadButton pattern) — filename-only for now.
const getLinkDetail = ({
  type,
  link,
  resolvedHref,
}: {
  type: ReturnType<typeof getLinkHubLinkType>
  link: LinkHubLinkProps
  resolvedHref: string
}): string => {
  switch (type) {
    case "file":
      return getFileNameFromHref(link.url)
    case "email":
      return link.url.replace(/^mailto:/, "")
    case "tel":
      return link.url.replace(/^tel:/, "")
    case "external":
    case "internal":
      return resolvedHref
  }
}

export const LinkHub = ({ title, description, links, site }: LinkHubProps) => {
  const styles = linkHubStyles()

  return (
    <div className={styles.root()}>
      {(title || description) && (
        <div className="flex flex-col gap-2">
          {title && <h2 className={styles.title()}>{title}</h2>}
          {description && <Prose {...description} site={site} />}
        </div>
      )}

      <ul className={styles.list()}>
        {links.map((link) => {
          const type = getLinkHubLinkType(link.url)
          const resolvedHref =
            getReferenceLinkHref(
              link.url,
              site.siteMapArray,
              site.assetsBaseUrl,
            ) ?? link.url
          const CardIcon = CARD_ICONS[type]
          const cta = CTAS[type]

          return (
            <li key={link.url}>
              <Link
                href={resolvedHref}
                isExternal={type === "external"}
                className={styles.card()}
              >
                <span className={styles.cardMain()}>
                  <CardIcon aria-hidden className={styles.cardIcon()} />
                  <span className={styles.cardText()}>
                    <span className={styles.cardTitle()}>{link.title}</span>
                    <span className={styles.cardDetail()}>
                      {getLinkDetail({ type, link, resolvedHref })}
                    </span>
                  </span>
                </span>

                <span className={styles.cta()}>
                  <span className={styles.ctaText()}>{cta.text}</span>
                  <cta.Icon aria-hidden className={styles.ctaIcon()} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
