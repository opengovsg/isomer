// Explicit interface rather than ReturnType<typeof getMetadata> to avoid
// tsgo union-type inference issues across React 18/19 package boundaries.
interface MetadataTagsProps {
  metadata: {
    title: string
    description?: string
    robots: { index: boolean }
    icons: { icon: string; shortcut: string }
    openGraph: {
      title: string
      description?: string
      url: string
      siteName: string
      type: string
      images?: { url: string }[]
    }
    twitter: { card: string }
    alternates: { canonical: string }
  }
  siteName: string
}

// Renders React 19 document metadata elements that are automatically hoisted
// to <head>. This replaces Next.js's generateMetadata / Metadata API.
const MetadataTags = ({ metadata, siteName }: MetadataTagsProps) => {
  const title = metadata.title ? `${metadata.title} | ${siteName}` : siteName

  return (
    <>
      <title>{title}</title>
      {metadata.description && (
        <meta name="description" content={metadata.description} />
      )}
      <meta
        name="robots"
        content={metadata.robots.index ? "index,follow" : "noindex"}
      />
      <link rel="canonical" href={metadata.alternates.canonical} />

      <meta property="og:title" content={metadata.openGraph.title} />
      {metadata.openGraph.description && (
        <meta
          property="og:description"
          content={metadata.openGraph.description}
        />
      )}
      <meta property="og:url" content={metadata.openGraph.url} />
      <meta property="og:site_name" content={metadata.openGraph.siteName} />
      <meta property="og:type" content={metadata.openGraph.type} />
      {metadata.openGraph.images?.[0] && (
        <meta property="og:image" content={metadata.openGraph.images[0].url} />
      )}

      <meta name="twitter:card" content={metadata.twitter.card} />

      <link rel="icon" href={metadata.icons.icon} />
      <link rel="shortcut icon" href={metadata.icons.shortcut} />
    </>
  )
}

export default MetadataTags
