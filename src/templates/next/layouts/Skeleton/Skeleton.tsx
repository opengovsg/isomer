import type { IsomerPageSchema } from "~/engine"

export const Skeleton = ({
  site,
  page,
  children,
}: React.PropsWithChildren<Pick<IsomerPageSchema, "site" | "page">>) => {
  return (
    <html lang={site.language} data-theme={site.theme}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, user-scalable=yes, initial-scale=1.0"
        />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />

        <meta property="og:title" content={page.title} />
        {page.noIndex && <meta name="robots" content="noindex" />}

        <title>{page.title}</title>
      </head>
      <body>{children}</body>
    </html>
  )
}
