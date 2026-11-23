import type { ParagraphProps, ProseProps, TextProps } from "~/interfaces"
import { polyfill } from "interweave-ssr"
import { escape, unescape } from "lodash-es"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeAll, describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"
import { renderComponent } from "~/templates/next/render/renderComponent"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { Accordion } from "../../../complex/Accordion"
import { Callout } from "../../../complex/Callout"
import { Contentpic } from "../../../complex/Contentpic"
import { Heading } from "../../../native/Heading"
import { Prose } from "../../../native/Prose"
import { Notification } from "../../Notification"
import { BaseParagraph } from "../BaseParagraph"

beforeAll(() => polyfill())

const site = generateSiteConfig()
const payload =
  '<a href="javascript:alert(1)">Download form</a><img src="injected.png"> &lt;b&gt;'

const renderTopLevelProse = (prose: Pick<ProseProps, "type" | "content">) =>
  renderComponent({
    component: prose,
    layout: "content",
    site,
    permalink: "/",
    headingLevel: 2,
  })

const containers = (text: TextProps) => {
  const paragraph: Omit<ParagraphProps, "site"> = {
    type: "paragraph",
    content: [text],
  }
  const prose: Pick<ProseProps, "type" | "content"> = {
    type: "prose",
    content: [paragraph],
  }
  return [
    ["prose", <Prose {...prose} site={site} headingLevel={2} />],
    ["top-level prose", renderTopLevelProse(prose)],
    [
      "table",
      <Prose
        type="prose"
        site={site}
        headingLevel={2}
        content={[
          {
            type: "table",
            attrs: { caption: "Caption" },
            content: [
              {
                type: "tableRow",
                content: [{ type: "tableCell", content: [paragraph] }],
              },
            ],
          },
        ]}
      />,
    ],
    ...(["orderedList", "unorderedList"] as const).map(
      (type) =>
        [
          type,
          <Prose
            type="prose"
            site={site}
            headingLevel={2}
            content={[
              {
                type,
                content: [{ type: "listItem", content: [paragraph] }],
              },
            ]}
          />,
        ] as const,
    ),
    [
      "accordion",
      <Accordion
        type="accordion"
        summary="Title"
        details={{ type: "prose", content: [paragraph] }}
        site={site}
        headingLevel={2}
      />,
    ],
    [
      "callout",
      <Callout
        type="callout"
        content={{ type: "prose", content: [paragraph] }}
        site={site}
        headingLevel={2}
      />,
    ],
    [
      "contentpic",
      <Contentpic
        imageSrc="/image.png"
        imageAlt="Image"
        content={{ type: "prose", content: [paragraph] }}
        site={site}
        headingLevel={2}
      />,
    ],
    [
      "notification text",
      <Notification title="Notice" content={[text]} site={site} />,
    ],
    [
      "notification prose",
      <Notification
        title="Notice"
        content={{ type: "prose", content: [paragraph] }}
        site={site}
      />,
    ],
  ] as const
}

describe("prose text rendering", () => {
  for (const marks of [undefined, [{ type: "bold" } as const]]) {
    for (const [name, element] of containers({
      type: "text",
      text: payload,
      marks,
    })) {
      it(`safely renders ${marks ? "marked" : "unmarked"} text in ${name}`, () => {
        // Act
        const html = renderToStaticMarkup(element)

        // Assert
        expect(html).not.toMatch(/<a\b/i)
        expect(html).not.toContain('src="injected.png"')
        expect(unescape(html.replace(/<[^>]*>/g, ""))).toContain(
          unescape(payload),
        )
      })
    }
  }

  for (const [name, element] of containers({
    type: "text",
    text: "A&nbsp;B &reg; &#169; &#x2122; &amp; R&D; &lt;img src=x&gt;",
  })) {
    it(`renders character references as characters in ${name}`, () => {
      // Act
      const html = renderToStaticMarkup(element)

      // Assert
      expect(unescape(html.replace(/<[^>]*>/g, ""))).toContain(
        "A B ® © ™ & R&D; <img src=x>",
      )
      expect(html).not.toMatch(/<img src="?x/i)
    })
  }

  it.each([undefined, [{ type: "bold" } as const]])(
    "renders tag-like text in top-level prose as typed with marks %j",
    (marks) => {
      // Arrange
      const text =
        'Enter <your NRIC> <span style="font-size:99px">label</span> m<sup>3</sup> & <script>alert(1)</script> <x'

      // Act
      const html = renderToStaticMarkup(
        renderTopLevelProse({
          type: "prose",
          content: [
            { type: "paragraph", content: [{ type: "text", text, marks }] },
          ],
        }),
      )

      // Assert
      expect(unescape(html.replace(/<[^>]*>/g, ""))).toBe(text)
      expect(html).not.toMatch(/<(span|sup|script)\b/i)
    },
  )

  it("preserves formatting, hard breaks and legitimate link marks", () => {
    // Arrange
    const content = getTextAsHtml({
      site,
      content: [
        {
          type: "text",
          text: "A & B < C",
          marks: [
            { type: "bold" },
            { type: "link", attrs: { href: "/page?a=1&b=2" } },
          ],
        },
        { type: "hardBreak" },
        { type: "text", text: "End", marks: [{ type: "italic" }] },
      ],
    })

    // Act
    const html = renderToStaticMarkup(<BaseParagraph content={content} />)

    // Assert
    expect(html).toContain('href="/page?a=1&amp;b=2"')
    expect(html).toContain("<b>A &amp; B &lt; C</b>")
    expect(html).toContain("<br/>")
    expect(html).toContain("<i>End</i>")
  })

  it("escapes quotes in link mark attributes", () => {
    // Arrange
    const href = '/page"><a href="javascript:alert(1)"><img src="injected.png'

    // Act
    const html = getTextAsHtml({
      site,
      content: [
        {
          type: "text",
          text: "Link",
          marks: [{ type: "link", attrs: { href, target: "_self" } }],
        },
      ],
    })

    // Assert
    expect(html).toBe(`<a target="_self" href="${escape(href)}">Link</a>`)
  })

  it("preserves literal special characters in headings", () => {
    // Act
    const html = renderToStaticMarkup(
      <Heading
        attrs={{ level: 2 }}
        content={[{ type: "text", text: "A & B < C" }]}
        site={site}
        headingLevel={2}
      />,
    )

    // Assert
    expect(unescape(html.replace(/<[^>]*>/g, ""))).toBe("A & B < C")
  })

  it("decodes character references in headings", () => {
    // Act
    const html = renderToStaticMarkup(
      <Heading
        attrs={{ level: 2 }}
        content={[{ type: "text", text: "A &amp; B&nbsp;&reg; <b>x</b>" }]}
        site={site}
        headingLevel={2}
      />,
    )

    // Assert
    expect(unescape(html.replace(/<[^>]*>/g, ""))).toBe("A & B ® <b>x</b>")
  })
})

describe("BaseParagraph anchor transformation", () => {
  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "java&#10;script:alert(1)",
    "data:text/html,evil",
    "vbscript:evil",
  ])("rejects unsafe href %s", (href) => {
    // Act
    const html = renderToStaticMarkup(
      <BaseParagraph content={`<a href="${href}">Download form</a>`} />,
    )

    // Assert
    expect(html).not.toMatch(/<a\b/i)
    expect(html).toContain("Download form")
  })

  it.each([
    "https://example.com/page",
    "/page",
    "#section",
    "mailto:hello@example.com",
    "tel:+6512345678",
  ])("preserves safe href %s", (href) => {
    // Act
    const html = renderToStaticMarkup(
      <BaseParagraph content={`<a href="${href}">Link</a>`} />,
    )

    // Assert
    expect(html).toContain(`href="${href}"`)
  })

  it("keeps anchors as links when the caller's allowed tags exclude them", () => {
    // Act
    const html = renderToStaticMarkup(
      <BaseParagraph
        allowedTags={["b"]}
        content='<a href="https://example.com">Link</a>'
      />,
    )

    // Assert
    expect(html).toContain('href="https://example.com"')
  })
})
