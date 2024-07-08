import {
  type IsomerPageSchemaType,
  RenderEngine,
} from '@opengovsg/isomer-components'
import { trpc } from '~/utils/trpc'

export default function Preview(props: IsomerPageSchemaType) {
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
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
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
    />
  )
}
