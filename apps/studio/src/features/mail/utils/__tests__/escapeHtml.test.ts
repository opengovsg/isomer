import { escapeHtml } from "../escapeHtml"

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`</p><a href='x&y'>Click "here"</a>`)).toBe(
      `&lt;/p&gt;&lt;a href=&#39;x&amp;y&#39;&gt;Click &quot;here&quot;&lt;/a&gt;`,
    )
  })

  it("treats undefined as an empty string", () => {
    expect(escapeHtml(undefined)).toBe("")
  })
})
