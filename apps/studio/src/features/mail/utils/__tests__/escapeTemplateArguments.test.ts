import type { EmailTemplate } from "../../templates/types"
import { escapeTemplateArguments } from "../escapeTemplateArguments"

describe("escapeTemplateArguments", () => {
  const malicious = `</p><h1>URGENT</h1><p>`
  const escaped = `&lt;/p&gt;&lt;h1&gt;URGENT&lt;/h1&gt;&lt;p&gt;`

  const createTemplate = () =>
    vi.fn((data: { title: string }): EmailTemplate => ({
      body: data.title,
      subject: data.title,
    }))

  it("escapes nested strings before calling the template", () => {
    // Arrange
    const template = createTemplate()
    const wrapped = escapeTemplateArguments({ alert: template })
    const input = {
      count: 2,
      nested: { labels: [malicious] },
      resource: { title: malicious },
      scheduledAt: new Date("2024-01-01T00:00:00.000Z"),
      title: malicious,
    }

    // Act
    const result = wrapped.alert(input)

    // Assert
    expect(template).toHaveBeenCalledWith({
      count: 2,
      nested: { labels: [escaped] },
      resource: { title: escaped },
      scheduledAt: input.scheduledAt,
      title: escaped,
    })
    expect(result).toEqual({ body: escaped, subject: escaped })
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
      resource: new ResourceLike(malicious),
      title: "irrelevant",
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
