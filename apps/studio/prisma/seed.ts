/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import type { IsomerSchema } from "@opengovsg/isomer-components"
import cuid2 from "@paralleldrive/cuid2"

import type { Navbar } from "~/server/modules/resource/resource.types"
import { db, jsonb } from "../src/server/modules/database"

const MOCK_PHONE_NUMBER = "123456789"

const ISOMER_ADMINS = [
  "alex",
  "jan",
  "kishore",
  "jiachin",
  "sehyun",
  "harish",
  "zhongjun",
  "hanpu",
]

const PAGE_BLOB: IsomerSchema = {
  version: "0.1.0",
  layout: "homepage",
  page: {},
  content: [
    {
      type: "hero",
      variant: "gradient",
      title: "Ministry of Trade and Industry",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
      backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    },
    {
      type: "infobar",
      title: "This is an infobar",
      description: "This is the description that goes into the Infobar section",
    },
    {
      type: "infopic",
      title: "This is an infopic",
      description: "This is the description for the infopic component",
      imageSrc: "https://placehold.co/600x400",
    },
    {
      type: "keystatistics",
      statistics: [
        {
          label: "Average all nighters pulled in a typical calendar month",
          value: "3",
        },
        {
          label: "Growth in tasks assigned Q4 2024 (YoY)",
          value: "+12.2%",
        },
        {
          label: "Creative blocks met per single evening",
          value: "89",
        },
        {
          value: "4.0",
          label: "Number of lies in this stat block",
        },
      ],
      title: "Irrationality in numbers",
    },
  ],
}
const NAV_BAR_ITEMS: Navbar["items"] = [
  {
    name: "Expandable nav item",
    url: "/item-one",
    items: [
      {
        name: "PA's network one",
        url: "/item-one/pa-network-one",
        description: "Click here and brace yourself for mild disappointment.",
      },
      {
        name: "PA's network two",
        url: "/item-one/pa-network-two",
        description: "Click here and brace yourself for mild disappointment.",
      },
      {
        name: "PA's network three",
        url: "/item-one/pa-network-three",
      },
      {
        name: "PA's network four",
        url: "/item-one/pa-network-four",
        description:
          "Click here and brace yourself for mild disappointment. This one has a pretty long one",
      },
      {
        name: "PA's network five",
        url: "/item-one/pa-network-five",
        description:
          "Click here and brace yourself for mild disappointment. This one has a pretty long one",
      },
      {
        name: "PA's network six",
        url: "/item-one/pa-network-six",
        description: "Click here and brace yourself for mild disappointment.",
      },
    ],
  },
]

const FOOTER_ITEMS = [
  {
    title: "About us",
    url: "/about",
  },
  {
    title: "Our partners",
    url: "/partners",
  },
  {
    title: "Grants and programmes",
    url: "/grants-and-programmes",
  },
  {
    title: "Contact us",
    url: "/contact-us",
  },
  {
    title: "Something else",
    url: "/something-else",
  },
  {
    title: "Resources",
    url: "/resources",
  },
]

async function main() {
  const { id: siteId } = await db
    .insertInto("Site")
    .values({
      name: "Ministry of Trade and Industry",
      config: jsonb({
        theme: "isomer-next",
        siteName: "MTI",
        logoUrl: "",
        search: undefined,
        isGovernment: true,
      }),
    })
    .onConflict((oc) =>
      oc
        .column("name")
        .doUpdateSet((eb) => ({ name: eb.ref("excluded.name") })),
    )
    .returning("id")
    .executeTakeFirstOrThrow()

  await db
    .insertInto("Footer")
    .values({
      siteId,
      content: jsonb({
        contactUsLink: "/contact-us",
        feedbackFormLink: "https://www.form.gov.sg",
        privacyStatementLink: "/privacy",
        termsOfUseLink: "/terms-of-use",
        siteNavItems: FOOTER_ITEMS,
      }),
    })
    .onConflict((oc) =>
      oc
        .column("siteId")
        .doUpdateSet((eb) => ({ siteId: eb.ref("excluded.siteId") })),
    )
    .execute()

  await db
    .insertInto("Navbar")
    .values({
      siteId,
      content: jsonb(NAV_BAR_ITEMS),
    })
    .onConflict((oc) =>
      oc
        .column("siteId")
        .doUpdateSet((eb) => ({ siteId: eb.ref("excluded.siteId") })),
    )
    .execute()

  let blobId = BigInt(1)
  const dedupeBlobId = await db
    .selectFrom("Blob")
    .where("Blob.id", "=", String(blobId))
    .select("Blob.id")
    .executeTakeFirst()
  if (!dedupeBlobId) {
    const { id } = await db
      .insertInto("Blob")
      .values({ content: jsonb(PAGE_BLOB) })
      .returning("id")
      .executeTakeFirstOrThrow()
    blobId = BigInt(id)
  }

  await db
    .insertInto("Resource")
    .values({
      draftBlobId: String(blobId),
      permalink: "home",
      siteId,
      type: "RootPage",
      title: "Home",
    })

    .onConflict((oc) =>
      oc
        .column("draftBlobId")
        .doUpdateSet((eb) => ({ draftBlobId: eb.ref("excluded.draftBlobId") })),
    )
    .executeTakeFirstOrThrow()

  await Promise.all(
    ISOMER_ADMINS.map((name) => {
      return db
        .insertInto("User")
        .values({
          id: cuid2.createId(),
          name,
          email: `${name}@open.gov.sg`,
          phone: MOCK_PHONE_NUMBER,
        })
        .onConflict((oc) =>
          oc
            .column("email")
            .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
        )
        .executeTakeFirstOrThrow()
    }),
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await db.destroy()
  })
