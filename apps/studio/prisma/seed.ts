/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import {
  type IsomerGeneratedSiteProps,
  type IsomerSiteConfigProps,
  type IsomerSitemap,
} from '@opengovsg/isomer-components'
import {
  type Navbar,
  type Footer,
} from '~/server/modules/resource/resource.types'
import cuid2 from '@paralleldrive/cuid2'
import { db } from '../src/server/modules/database'

const MOCK_PHONE_NUMBER = '123456789'

const ISOMER_ADMINS = [
  'alex',
  'jan',
  'kishore',
  'jiachin',
  'sehyun',
  'harish',
  'zhongjun',
  'hanpu',
]

const PAGE_BLOB = {
  version: '0.1.0',
  layout: 'homepage',
  page: {
    title: 'Home',
  },
  content: [
    {
      type: 'hero',
      variant: 'gradient',
      alignment: 'left',
      backgroundColor: 'black',
      title: 'Ministry of Trade and Industry',
      subtitle:
        'A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity',
      buttonLabel: 'Main CTA',
      buttonUrl: '/',
      secondaryButtonLabel: 'Sub CTA',
      secondaryButtonUrl: '/',
      backgroundUrl: 'https://ohno.isomer.gov.sg/images/hero-banner.png',
    },
    {
      type: 'infobar',
      title: 'This is an infobar',
      description: 'This is the description that goes into the Infobar section',
    },
    {
      type: 'infopic',
      title: 'This is an infopic',
      description: 'This is the description for the infopic component',
      imageSrc: 'https://placehold.co/600x400',
    },
    {
      type: 'keystatistics',
      statistics: [
        {
          label: 'Average all nighters pulled in a typical calendar month',
          value: '3',
        },
        {
          label: 'Growth in tasks assigned Q4 2024 (YoY)',
          value: '+12.2%',
        },
        {
          label: 'Creative blocks met per single evening',
          value: '89',
        },
        {
          value: '4.0',
          label: 'Number of lies in this stat block',
        },
      ],
      variant: 'top',
      title: 'Irrationality in numbers',
    },
  ],
}
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
  const { id: siteId } = await db
    .insertInto('Site')
    .values({
      name: 'Ministry of Trade and Industry',
      config: {
        theme: 'isomer-next',
        siteName: 'MTI',
        logoUrl: '',
        search: undefined,
        // TODO: Remove siteMap as it is a generated field
        siteMap: {
          title: 'Home',
          permalink: '/',
          children: [],
          layout: 'content',
          summary: 'something',
          lastModified: '',
        } satisfies IsomerSitemap,
        isGovernment: true,
      } satisfies IsomerSiteConfigProps & {
        siteMap: IsomerGeneratedSiteProps['siteMap']
      },
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  await db
    .insertInto('Footer')
    .values({
      siteId,
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
      siteId,
      content: { items: NAV_BAR_ITEMS } satisfies Navbar,
    })
    .execute()

  const { id: blobId } = await db
    .insertInto('Blob')
    .values({ content: PAGE_BLOB })
    .returning('id')
    .executeTakeFirstOrThrow()

  await db
    .insertInto('Resource')
    .values({ blobId, name: 'Home', siteId })
    .executeTakeFirstOrThrow()

  await Promise.all(
    ISOMER_ADMINS.map((name) => {
      return db
        .insertInto('User')
        .values({
          id: cuid2.createId(),
          name,
          email: `${name}@open.gov.sg`,
          phone: MOCK_PHONE_NUMBER,
        })
        .executeTakeFirstOrThrow()
    }),
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.destroy()
  })
