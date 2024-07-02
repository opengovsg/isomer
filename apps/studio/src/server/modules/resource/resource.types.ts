import {
  type IsomerPageSchema,
  type IsomerSiteProps,
} from '@opengovsg/isomer-components'
import { type Resource } from 'prisma/generated/generatedTypes'
import { type SetRequired } from 'type-fest'

export type PageContent = Omit<
  IsomerPageSchema,
  'layout' | 'LinkComponent' | 'ScriptComponent'
>

export type Page = SetRequired<Resource, 'blobId'>

export type Navbar = { items: IsomerSiteProps['navBarItems'] }

export type Footer = IsomerSiteProps['footerItems']
