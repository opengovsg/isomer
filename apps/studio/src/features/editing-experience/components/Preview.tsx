import { IsomerPageSchema, RenderEngine } from '@opengovsg/isomer-components'
import navBar from '../data/navbar.json'
import footer from '../data/footer.json'

export interface PreviewProps {
  schema?: {
    version: string
    layout: string
    page: any
    content: IsomerPageSchema['content']
  }
}
export default function Preview({ schema }: PreviewProps) {
  const renderSchema = schema!

  return (
    <RenderEngine
      site={{
        siteName: 'Min of ZYX',
        // @ts-expect-error blah
        siteMap: { title: 'Home', permalink: '/', children: [] },
        theme: 'isomer-next',
        logoUrl: 'https://www.isomer.gov.sg/images/isomer-logo.svg',
        isGovernment: true,
        environment: 'production',
        lastUpdated: '3 Apr 2024',
        navBarItems: navBar,
        // @ts-expect-error blah
        footerItems: footer,
      }}
      // @ts-expect-error blah
      layout={renderSchema.layout}
      page={{
        ...renderSchema.page,
        permalink: '/',
        lastModified: new Date().toISOString(),
      }}
      content={renderSchema.content}
    />
  )
}
