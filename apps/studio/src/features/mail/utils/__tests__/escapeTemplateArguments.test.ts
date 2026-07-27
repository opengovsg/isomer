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

  it("escapes nested strings before calling the template", () => {
    // Arrange
    const template = createTemplate()
    const wrapped = escapeTemplateArguments({ alert: template })
    const input = {
      title: malicious,
      nested: { labels: [malicious] },
      resource: { title: malicious },
      count: 2,
      scheduledAt: new Date("2024-01-01T00:00:00.000Z"),
    }

    // Act
    const result = wrapped.alert(input)

    // Assert
    expect(template).toHaveBeenCalledWith({
      title: escaped,
      nested: { labels: [escaped] },
      resource: { title: escaped },
      count: 2,
      scheduledAt: input.scheduledAt,
    })
    expect(result).toEqual({ subject: escaped, body: escaped })
    expect(input.title).toBe(malicious)
  })

  it("throws for class instances", () => {
    // Arrange
    class ResourceLike {
      constructor(public title: string) {}
    }

    const template = createTemplate()
    const wrapped = escapeTemplateArguments({ alert: template })
    const input = {
      title: "irrelevant",
      resource: new ResourceLike(malicious),
    }

    // Act / Assert
    expect(() => wrapped.alert(input)).toThrow()
    expect(template).not.toHaveBeenCalled()
  })

  it("wraps every template without changing keys", () => {
    // Arrange
    const first = createTemplate()
    const second = createTemplate()
    const wrapped = escapeTemplateArguments({ first, second })

    // Act
    wrapped.first({ title: malicious })
    wrapped.second({ title: "Safe title" })

    // Assert
    expect(first).toHaveBeenCalledWith({ title: escaped })
    expect(second).toHaveBeenCalledWith({ title: "Safe title" })
  })
})
