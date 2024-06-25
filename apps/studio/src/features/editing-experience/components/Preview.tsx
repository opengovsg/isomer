import {
  type IsomerComponent,
  type IsomerPageSchema,
  RenderEngine,
} from '@opengovsg/isomer-components'
import { trpc } from '~/utils/trpc'

export interface PreviewProps {
  schema?: {
    version: string
    layout: string
    page: any
    content: IsomerComponent
  }
}

export default function Preview({ schema }: PreviewProps) {
  const renderSchema = schema!
  const [{ theme, isGovernment, sitemap, name }] =
    trpc.site.getConfig.useSuspenseQuery({ id: 1 })
  const [{ content: footer }] = trpc.site.getFooter.useSuspenseQuery({
    id: 1,
  })
  const [{ content: navbar }] = trpc.site.getNavbar.useSuspenseQuery({
    id: 1,
  })
  const [{ content: page }] = trpc.page.readPageAndBlob.useSuspenseQuery({
    pageId: 1,
  })

  return (
    <RenderEngine
      site={{
        siteName: name,
        // TODO: fixup all the typing errors
        // @ts-expect-error blah
        // TODO: dynamically generate sitemap
        siteMap: { title: 'Home', permalink: '/', children: [] },
        theme,
        logoUrl: 'https://www.isomer.gov.sg/images/isomer-logo.svg',
        isGovernment,
        environment: 'production',
        lastUpdated: '3 Apr 2024',
        navBarItems: navbar.items,
        footerItems: footer,
      }}
      // @ts-expect-error blah
      layout={renderSchema.layout}
      page={{
        ...renderSchema.page,
        permalink: '/',
        lastModified: new Date().toISOString(),
      }}
      // TODO: remove this cast and add validation
      content={page.content}
    />
  )
}
