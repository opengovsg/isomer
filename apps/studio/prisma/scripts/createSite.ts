import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ISOMER_ADMINS, ISOMER_MIGRATORS } from "~prisma/constants"

import type { Navbar } from "~/server/modules/resource/resource.types"
import { db, jsonb, RoleType } from "~/server/modules/database"
import { addUsersToSite } from "./addUsersToSite"

const PAGE_BLOB: IsomerSchema = {
  version: "0.1.0",
  layout: "homepage",
  page: {},
  content: [
    {
      type: "hero",
      variant: "gradient",
      title: "Isomer",
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

const FOOTER = {
  contactUsLink: "/contact-us",
  feedbackFormLink: "https://www.form.gov.sg",
  privacyStatementLink: "/privacy",
  termsOfUseLink: "/terms-of-use",
  siteNavItems: FOOTER_ITEMS,
}

interface CreateSiteProps {
  siteName: string
}
export const createSite = async ({ siteName }: CreateSiteProps) => {
  const siteId = await db.transaction().execute(async (tx) => {
    const { id: siteId } = await tx
      .insertInto("Site")
      .values({
        name: siteName,
        theme: jsonb({
          colors: {
            brand: {
              canvas: {
                alt: "#bfcfd7",
                default: "#e6ecef",
                inverse: "#00405f",
                backdrop: "#80a0af",
              },
              interaction: {
                hover: "#002e44",
                default: "#00405f",
                pressed: "#00283b",
              },
            },
          },
        }),
        config: jsonb({
          theme: "isomer-next",
          siteName,
          logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
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

    await tx
      .insertInto("Footer")
      .values({
        siteId,
        content: jsonb(FOOTER),
      })
      .onConflict((oc) =>
        oc
          .column("siteId")
          .doUpdateSet((eb) => ({ siteId: eb.ref("excluded.siteId") })),
      )
      .execute()

    await tx
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

    const { id: blobId } = await tx
      .insertInto("Blob")
      .values({ content: jsonb(PAGE_BLOB) })
      .returning("id")
      .executeTakeFirstOrThrow()

    await tx
      .insertInto("Resource")
      .values({
        draftBlobId: String(blobId),
        permalink: "",
        siteId,
        type: "RootPage",
        title: "Home",
      })

      .onConflict((oc) =>
        oc.column("draftBlobId").doUpdateSet((eb) => ({
          draftBlobId: eb.ref("excluded.draftBlobId"),
        })),
      )
      .executeTakeFirstOrThrow()

    console.log(`Added site ${siteName} with id ${siteId} to database`)
    return siteId
  })

  await addUsersToSite({
    siteId,
    users: [...ISOMER_ADMINS, ...ISOMER_MIGRATORS].map((email) => ({
      email: `${email}@open.gov.sg`,
      role: RoleType.Admin,
    })),
  })

  return siteId
}

// NOTE: Update the site name here before executing!
await createSite({ siteName: "" })
