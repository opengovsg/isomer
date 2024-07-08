import {
  type IsomerPageSchema,
  RenderEngine,
} from '@opengovsg/isomer-components'
import { trpc } from '~/utils/trpc'

export default function Preview({ layout, content, page }: IsomerPageSchema) {
  const [{ theme, isGovernment, sitemap, name }] =
    trpc.site.getConfig.useSuspenseQuery({ id: 1 })
  const [{ content: footer }] = trpc.site.getFooter.useSuspenseQuery({
    id: 1,
  })
  const [{ content: navbar }] = trpc.site.getNavbar.useSuspenseQuery({
    id: 1,
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
      layout={layout}
      // TODO: remove this cast and add validation
      content={content}
      page={page}
    />
  )
}
