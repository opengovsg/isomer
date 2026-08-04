import type { CreateGazetteInput } from "~/schemas/gazette"
import { ThemeProvider } from "@opengovsg/design-system-react"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { useForm } from "react-hook-form"
import { afterEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
} from "../../constants"
import { GazetteSubcategoriesProvider } from "../../contexts/GazetteSubcategoriesContext"
import { GazetteFormFields } from "./GazetteFormFields"

const CATEGORY_GOV_ID = "cat-gov-uuid"
const UNRESOLVED_CATEGORY_ID = "uuid-not-in-this-collections-taxonomy"

const TAG_CATEGORIES = [
  {
    label: GAZETTE_CATEGORY_LABEL,
    options: [{ id: CATEGORY_GOV_ID, label: "Government Gazette" }],
  },
  {
    label: GAZETTE_SUBCATEGORY_LABEL,
    options: [
      // Allowed under Government Gazette.
      { id: "sub-tenders-uuid", label: "Tenders" },
      // Allowed only under Legislative Supplements — must never be offered
      // while Government Gazette is the selected category.
      { id: "sub-acts-uuid", label: "Acts Supplement" },
    ],
  },
]

// GazetteSubcategoriesProvider reads the collection taxonomy over trpc. Stub the
// single procedure it calls so these tests exercise the *real* context logic
// (option→label maps, getSubcategoriesForCategory) rather than a mocked context.
vi.mock("~/utils/trpc", () => ({
  trpc: {
    collection: {
      getCollectionTags: {
        useSuspenseQuery: () => [TAG_CATEGORIES],
      },
    },
  },
}))

const UNRESOLVED_MESSAGE = /category is not one of this collection's options/i

const Harness = ({ category }: { category: string }) => {
  const { register, control, setValue, formState } =
    useForm<CreateGazetteInput>({
      defaultValues: {
        title: "",
        category,
        subcategory: "",
        notificationNumber: "",
        publishDate: new Date("2026-04-30T00:00:00.000Z"),
        publishTime: "16:45",
        fileId: "",
      },
    })

  return (
    <GazetteFormFields
      register={register}
      control={control}
      errors={formState.errors}
      setValue={setValue}
    />
  )
}

const renderFields = (category: string) =>
  render(
    <ThemeProvider theme={theme}>
      <GazetteSubcategoriesProvider siteId={1} gazettesCollectionId={2}>
        <Harness category={category} />
      </GazetteSubcategoriesProvider>
    </ThemeProvider>,
  )

// The form renders the Category SingleSelect first and Subcategory second.
const openSubcategoryDropdown = async () => {
  const comboboxes = await screen.findAllByRole("combobox")
  const subcategory = comboboxes[1]
  if (!subcategory) {
    throw new Error("Expected a subcategory combobox to be rendered")
  }
  fireEvent.click(subcategory)
}

afterEach(() => {
  cleanup()
})

// Regression guard for the pre-cutover masking behaviour: the category label
// used to fall back to the raw uuid (`categoryMap[category] ?? category`), which
// fed an unrecognised string into getSubcategoriesForCategory. That silently
// produced an EMPTY Subcategory dropdown with nothing on screen to explain why —
// the exact symptom of a gazette written before the tagCategories cutover. The
// form must now name the problem instead.
describe("GazetteFormFields category resolution", () => {
  it("flags a category uuid that is not one of the collection's options", async () => {
    renderFields(UNRESOLVED_CATEGORY_ID)

    await waitFor(() => {
      expect(screen.queryByText(UNRESOLVED_MESSAGE)).not.toBeNull()
    })
  })

  it("does not flag a category that resolves against the collection taxonomy", async () => {
    renderFields(CATEGORY_GOV_ID)

    await screen.findAllByRole("combobox")
    expect(screen.queryByText(UNRESOLVED_MESSAGE)).toBeNull()
  })

  it("does not flag the category before one has been selected", async () => {
    renderFields("")

    await screen.findAllByRole("combobox")
    expect(screen.queryByText(UNRESOLVED_MESSAGE)).toBeNull()
  })

  it("offers only the subcategories allowed for the resolved category", async () => {
    renderFields(CATEGORY_GOV_ID)

    await openSubcategoryDropdown()

    await waitFor(() => {
      expect(screen.queryByText("Tenders")).not.toBeNull()
    })
    // Pairing rules still applied: Acts Supplement belongs to a different
    // category, so it must not be selectable here.
    expect(screen.queryByText("Acts Supplement")).toBeNull()
  })

  it("offers no subcategories when the category is unresolvable", async () => {
    renderFields(UNRESOLVED_CATEGORY_ID)

    await openSubcategoryDropdown()

    expect(screen.queryByText("Tenders")).toBeNull()
    expect(screen.queryByText("Acts Supplement")).toBeNull()
  })
})
