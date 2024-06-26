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

async function main() {
  const { id } = await db
    .insertInto('Site')
    .values({
      name: 'Ministry of Trade and Industry',
      config: {
        theme: 'isomer-next',
        sitemap: {
          siblingTitles: [],
          childrenTitles: [],
          parentTitle: '',
        },
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
        name: 'A foot',
        contactUsLink: '/contact-us',
        feedbackFormLink: 'https://www.form.gov.sg',
        privacyStatementLink: '/privacy',
        termsOfUseLink: '/terms-of-use',
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
