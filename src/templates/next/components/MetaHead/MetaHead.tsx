import { MetaHeadProps } from "~/common"

const MetaHead = ({
  title,
  description,
  noIndex,
  favicon,
  HeadComponent = "head",
}: MetaHeadProps) => {
  return (
    <HeadComponent>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, user-scalable=yes, initial-scale=1.0"
      />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Title */}
      <meta property="og:title" content={title} />
      <title>{title}</title>

      {/* Description */}
      {description && (
        <>
          <meta property="og:description" content={description} />
          <meta name="Description" content={description} />
        </>
      )}

      {/* Noindex */}
      {noIndex && <meta name="robots" content="noindex" />}

      {/* Favicon */}
      <link
        rel="shortcut icon"
        href={favicon || "https://www.isomer.gov.sg/images/favicon-isomer.ico"}
        type="image/x-icon"
      />
    </HeadComponent>
  )
}

export default MetaHead
