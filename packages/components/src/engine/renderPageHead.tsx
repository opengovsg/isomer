import type { IsomerPageSchemaType } from "~/types/schema"

import { getMetadata } from "./metadata"

/**
 * The page's <head> tags (title, description, robots, canonical, Open Graph, Twitter, icons),
 * for hosts that render the document themselves. Next consumes getMetadata() instead.
 */
export const RenderPageHead = (props: IsomerPageSchemaType) => {
  const metadata = getMetadata(props)
  const absolute = (url?: string) =>
    url && metadata.metadataBase
      ? new URL(url, metadata.metadataBase).toString()
      : url
  const { openGraph: og } = metadata
  const images = og.images ?? []
  const rss = metadata.alternates.types?.["application/rss+xml"] ?? []
  const title = metadata.title
    ? `${metadata.title} | ${props.site.siteName}`
    : props.site.siteName

  return (
    <>
      <title>{title}</title>
      {metadata.description && (
        <meta name="description" content={metadata.description} />
      )}
      <meta
        name="robots"
        content={metadata.robots.index ? "index" : "noindex"}
      />
      <link rel="canonical" href={absolute(metadata.alternates.canonical)} />
      {rss.map(({ url, title: rssTitle }) => (
        <link
          key={url}
          rel="alternate"
          type="application/rss+xml"
          title={rssTitle}
          href={absolute(url)}
        />
      ))}
      <meta property="og:title" content={og.title} />
      {og.description && (
        <meta property="og:description" content={og.description} />
      )}
      <meta property="og:url" content={absolute(og.url)} />
      <meta property="og:site_name" content={og.siteName} />
      {images.map(({ url }) => (
        <meta key={url} property="og:image" content={absolute(url)} />
      ))}
      <meta property="og:type" content={og.type} />
      <meta name="twitter:card" content={metadata.twitter.card} />
      <meta name="twitter:title" content={og.title} />
      {og.description && (
        <meta name="twitter:description" content={og.description} />
      )}
      {images.map(({ url }) => (
        <meta key={url} name="twitter:image" content={absolute(url)} />
      ))}
      <link rel="shortcut icon" href={metadata.icons.shortcut} />
      <link rel="icon" href={metadata.icons.icon} />
    </>
  )
}
