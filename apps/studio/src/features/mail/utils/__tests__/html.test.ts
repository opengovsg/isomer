import { escapeHtml, unescapeHtml } from "../html"

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    // Arrange
    const raw = `</p><a href='x&y'>Click "here"</a>`

    // Act
    const result = escapeHtml(raw)

    // Assert
    expect(result).toBe(
      `&lt;/p&gt;&lt;a href=&#39;x&amp;y&#39;&gt;Click &quot;here&quot;&lt;/a&gt;`,
    )
  })

  it("treats undefined as an empty string", () => {
    // Act
    const result = escapeHtml(undefined)

    // Assert
    expect(result).toBe("")
  })
})

describe("unescapeHtml", () => {
  it("reverses HTML entity escaping", () => {
    // Arrange
    const escaped = `&lt;/p&gt;&lt;a href=&#39;x&amp;y&#39;&gt;Click &quot;here&quot;&lt;/a&gt;`

    // Act
    const result = unescapeHtml(escaped)

    // Assert
    expect(result).toBe(`</p><a href='x&y'>Click "here"</a>`)
  })

  it("undoes escapeHtml", () => {
    // Arrange
    const original = `Fish & Chips <2024>`

    // Act
    const result = unescapeHtml(escapeHtml(original))

    // Assert
    expect(result).toBe(original)
  })
})
