/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { type SiteConfig } from '~/server/modules/site/site.types'
import {
  type Navbar,
  type Footer,
} from '~/server/modules/resource/resource.types'
import { type IsomerSitemap } from '@opengovsg/isomer-components'
import { db } from '../src/server/modules/database'

const NAV_BAR_ITEMS: Navbar['items'] = [
  {
    name: 'Expandable nav item',
    url: '/item-one',
    items: [
      {
        name: "PA's network one",
        url: '/item-one/pa-network-one',
        description: 'Click here and brace yourself for mild disappointment.',
      },
      {
        name: "PA's network two",
        url: '/item-one/pa-network-two',
        description: 'Click here and brace yourself for mild disappointment.',
      },
      {
        name: "PA's network three",
        url: '/item-one/pa-network-three',
      },
      {
        name: "PA's network four",
        url: '/item-one/pa-network-four',
        description:
          'Click here and brace yourself for mild disappointment. This one has a pretty long one',
      },
      {
        name: "PA's network five",
        url: '/item-one/pa-network-five',
        description:
          'Click here and brace yourself for mild disappointment. This one has a pretty long one',
      },
      {
        name: "PA's network six",
        url: '/item-one/pa-network-six',
        description: 'Click here and brace yourself for mild disappointment.',
      },
    ],
  },
]

const FOOTER_ITEMS = [
  {
    title: 'About us',
    url: '/about',
  },
  {
    title: 'Our partners',
    url: '/partners',
  },
  {
    title: 'Grants and programmes',
    url: '/grants-and-programmes',
  },
  {
    title: 'Contact us',
    url: '/contact-us',
  },
  {
    title: 'Something else',
    url: '/something-else',
  },
  {
    title: 'Resources',
    url: '/resources',
  },
]

async function main() {
  const { id } = await db
    .insertInto('Site')
    .values({
      name: 'Ministry of Trade and Industry',
      config: {
        theme: 'isomer-next',
        sitemap: {
          title: 'Home',
          permalink: '/',
          children: [],
          layout: 'content',
          summary: 'something',
          lastModified: '',
        } satisfies IsomerSitemap,
        isGovernment: true,
      } satisfies SiteConfig,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  await db
    .insertInto('Footer')
    .values({
      siteId: id,
      content: {
        contactUsLink: '/contact-us',
        feedbackFormLink: 'https://www.form.gov.sg',
        privacyStatementLink: '/privacy',
        termsOfUseLink: '/terms-of-use',
        siteNavItems: FOOTER_ITEMS,
      } satisfies Footer,
    })
    .execute()

  await db
    .insertInto('Navbar')
    .values({
      siteId: id,
      content: { items: NAV_BAR_ITEMS } satisfies Navbar,
    })
    .execute()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.destroy()
  })
