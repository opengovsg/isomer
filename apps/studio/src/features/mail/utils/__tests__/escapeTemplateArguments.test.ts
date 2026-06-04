import type { EmailTemplate } from "../../templates/types"
import { escapeTemplateArguments } from "../escapeTemplateArguments"

describe("escapeTemplateArguments", () => {
  const malicious = `</p><h1>URGENT</h1><p>`
  const escaped = `&lt;/p&gt;&lt;h1&gt;URGENT&lt;/h1&gt;&lt;p&gt;`

  const createTemplate = () =>
    vi.fn(
      (data: { title: string }): EmailTemplate => ({
        subject: data.title,
        body: data.title,
      }),
    )

  it("escapes template data before calling the underlying template", () => {
    class ResourceLike {
      constructor(public title: string) {}
    }

    const template = createTemplate()
    const wrapped = escapeTemplateArguments({ alert: template })
    const resource = new ResourceLike(malicious)

    const input = {
      title: malicious,
      nested: { labels: [malicious] },
      resource,
      count: 2,
      scheduledAt: new Date("2024-01-01T00:00:00.000Z"),
    }
    const result = wrapped.alert(input)

    expect(template).toHaveBeenCalledWith({
      title: escaped,
      nested: { labels: [escaped] },
      resource,
      count: 2,
      scheduledAt: input.scheduledAt,
    })
    expect(result).toEqual({ subject: escaped, body: escaped })
    expect(input.title).toBe(malicious)
    expect(resource.title).toBe(malicious)
  })

  it("wraps every template without changing keys", () => {
    const first = createTemplate()
    const second = createTemplate()
    const wrapped = escapeTemplateArguments({ first, second })

    wrapped.first({ title: malicious })
    wrapped.second({ title: "Safe title" })

    expect(first).toHaveBeenCalledWith({ title: escaped })
    expect(second).toHaveBeenCalledWith({ title: "Safe title" })
  })
})
