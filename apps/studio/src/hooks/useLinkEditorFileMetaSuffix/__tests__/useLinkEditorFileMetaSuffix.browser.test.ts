import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useLinkEditorFileMetaSuffix } from "../useLinkEditorFileMetaSuffix"

/** Minimal stand-in for browser `File` (implementation only uses `name` and `size`). */
const mockFile = (name: string, size: number): File => ({ name, size }) as File

const FILE_HREF = "/123/550e8400-e29b-41d4-a716-446655440000/doc.pdf"
const PAGE_HREF = "[resource:1:42]"
const EXTERNAL_HREF = "https://example.com/page"
const EMAIL_HREF = "mailto:user@example.com"

const INITIAL_FILE_LINK_TEXT = "Download [PDF, 1.00 MB]"

describe("useLinkEditorFileMetaSuffix", () => {
  it("strips file meta suffix on open and re-appends it on save for file links", () => {
    // Arrange
    const { result } = renderHook(() =>
      useLinkEditorFileMetaSuffix({
        initialLinkText: INITIAL_FILE_LINK_TEXT,
        initialLinkHref: FILE_HREF,
        showLinkText: true,
      }),
    )

    // Assert — open
    expect(result.current.strippedLinkText).toBe("Download")

    // Act + Assert — save round-trip
    let savedText: string | undefined
    act(() => {
      savedText = result.current.buildFinalLinkTextForSave(
        "Download",
        FILE_HREF,
      )
    })
    expect(savedText).toBe(INITIAL_FILE_LINK_TEXT)
  })

  it.each([
    ["page", PAGE_HREF],
    ["external", EXTERNAL_HREF],
    ["email", EMAIL_HREF],
  ])(
    "preserves suffix-shaped link text for %s links on open and save",
    (_label, linkHref) => {
      // Arrange
      const { result } = renderHook(() =>
        useLinkEditorFileMetaSuffix({
          initialLinkText: INITIAL_FILE_LINK_TEXT,
          initialLinkHref: linkHref,
          showLinkText: true,
        }),
      )

      // Assert — open
      expect(result.current.strippedLinkText).toBe(INITIAL_FILE_LINK_TEXT)

      // Act + Assert — save
      let savedText: string | undefined
      act(() => {
        savedText = result.current.buildFinalLinkTextForSave(
          INITIAL_FILE_LINK_TEXT,
          linkHref,
        )
      })
      expect(savedText).toBe(INITIAL_FILE_LINK_TEXT)
    },
  )

  it("preserves suffix-shaped link text when showLinkText is false", () => {
    // Arrange
    const { result } = renderHook(() =>
      useLinkEditorFileMetaSuffix({
        initialLinkText: INITIAL_FILE_LINK_TEXT,
        initialLinkHref: FILE_HREF,
        showLinkText: false,
      }),
    )

    // Assert — open
    expect(result.current.strippedLinkText).toBe(INITIAL_FILE_LINK_TEXT)
    expect(result.current.onUploadedFile).toBeUndefined()

    // Act + Assert — save
    let savedText: string | undefined
    act(() => {
      savedText = result.current.buildFinalLinkTextForSave(
        INITIAL_FILE_LINK_TEXT,
        FILE_HREF,
      )
    })
    expect(savedText).toBe(INITIAL_FILE_LINK_TEXT)
  })

  it("swaps the stored suffix after upload and uses it on save", () => {
    // Arrange
    const { result } = renderHook(() =>
      useLinkEditorFileMetaSuffix({
        initialLinkText: INITIAL_FILE_LINK_TEXT,
        initialLinkHref: FILE_HREF,
        showLinkText: true,
      }),
    )

    // Act — upload replacement file
    act(() => {
      result.current.onUploadedFile?.(mockFile("report.xlsx", 2048))
    })

    // Act + Assert — save uses new suffix
    let savedText: string | undefined
    act(() => {
      savedText = result.current.buildFinalLinkTextForSave(
        "Download",
        FILE_HREF,
      )
    })
    expect(savedText).toBe("Download [XLSX, 2.00 KB]")
  })

  it("does not re-append file suffix when saving as a non-file link", () => {
    // Arrange
    const { result } = renderHook(() =>
      useLinkEditorFileMetaSuffix({
        initialLinkText: INITIAL_FILE_LINK_TEXT,
        initialLinkHref: FILE_HREF,
        showLinkText: true,
      }),
    )

    // Act + Assert — user edits link text then switches href to a page link
    let savedText: string | undefined
    act(() => {
      savedText = result.current.buildFinalLinkTextForSave(
        "Download",
        PAGE_HREF,
      )
    })
    expect(savedText).toBe("Download")
  })

  it("ignores upload callback when the uploaded file has no meta suffix", () => {
    // Arrange
    const { result } = renderHook(() =>
      useLinkEditorFileMetaSuffix({
        initialLinkText: INITIAL_FILE_LINK_TEXT,
        initialLinkHref: FILE_HREF,
        showLinkText: true,
      }),
    )

    // Act — upload with no type or size metadata
    act(() => {
      result.current.onUploadedFile?.(mockFile("unknown.bin", 0))
    })

    // Act + Assert — original suffix is preserved on save
    let savedText: string | undefined
    act(() => {
      savedText = result.current.buildFinalLinkTextForSave(
        "Download",
        FILE_HREF,
      )
    })
    expect(savedText).toBe(INITIAL_FILE_LINK_TEXT)
  })

  it("strips any user-entered suffix from link text before re-appending on file save", () => {
    // Arrange
    const { result } = renderHook(() =>
      useLinkEditorFileMetaSuffix({
        initialLinkText: INITIAL_FILE_LINK_TEXT,
        initialLinkHref: FILE_HREF,
        showLinkText: true,
      }),
    )

    // Act + Assert — edited text already includes a suffix; save dedupes it
    let savedText: string | undefined
    act(() => {
      savedText = result.current.buildFinalLinkTextForSave(
        "Download [PDF, 999.00 MB]",
        FILE_HREF,
      )
    })
    expect(savedText).toBe(INITIAL_FILE_LINK_TEXT)
  })

  it("clears stored suffix after save so a subsequent save does not double-append", () => {
    // Arrange
    const { result } = renderHook(() =>
      useLinkEditorFileMetaSuffix({
        initialLinkText: INITIAL_FILE_LINK_TEXT,
        initialLinkHref: FILE_HREF,
        showLinkText: true,
      }),
    )

    // Act — first save consumes suffix state
    act(() => {
      result.current.buildFinalLinkTextForSave("Download", FILE_HREF)
    })

    // Act + Assert — second save without a new upload keeps stripped text
    let savedText: string | undefined
    act(() => {
      savedText = result.current.buildFinalLinkTextForSave(
        "Download",
        FILE_HREF,
      )
    })
    expect(savedText).toBe("Download")
  })
})
