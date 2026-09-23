import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureCollectionDateFilterSortSaved,
  captureCollectionItemDateSaveBlocked,
  captureCollectionItemDateSaved,
  captureDateFilterCreated,
  captureDateFilterOnboardingBannerShown,
  captureDateFilterOnboardingBannerSupportLinkClicked,
  captureDateFilterSaved,
} from "../dateFilters"

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))

const context = { siteId: 12, isDateFiltersEnabled: true }

describe("date filter analytics", () => {
  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear()
  })

  it("records the onboarding banner as shown", () => {
    // Arrange / Act
    captureDateFilterOnboardingBannerShown(context)

    // Assert
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith(
      "date_filter_onboarding_banner",
      {
        action: "shown",
        site_id: 12,
        is_date_filters_enabled: true,
      },
    )
  })

  it("records the onboarding support link click", () => {
    // Arrange / Act
    captureDateFilterOnboardingBannerSupportLinkClicked(context)

    // Assert
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith(
      "date_filter_onboarding_banner",
      {
        action: "support_link_clicked",
        site_id: 12,
        is_date_filters_enabled: true,
      },
    )
  })

  it("records a created filter type", () => {
    // Arrange / Act
    captureDateFilterCreated({ ...context, filterType: "date" })

    // Assert
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith(
      "date_filter_created",
      {
        filter_type: "date",
        site_id: 12,
        is_date_filters_enabled: true,
      },
    )
  })

  it("records the saved filter setup", () => {
    // Arrange / Act
    captureDateFilterSaved({
      ...context,
      isRequired: false,
      showStatusLabelsFilter: false,
      showDateRangeFilter: true,
      statusLabelsCustomized: true,
    })

    // Assert
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith(
      "date_filter_saved",
      {
        is_required: false,
        show_status_labels_filter: false,
        show_date_range_filter: true,
        status_labels_customized: true,
        site_id: 12,
        is_date_filters_enabled: true,
      },
    )
  })

  it("records a saved item date", () => {
    // Arrange / Act
    captureCollectionItemDateSaved({
      ...context,
      datesFilled: 1,
      dateFilterCount: 2,
      hasRange: false,
    })

    // Assert
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith(
      "collection_item_date_saved",
      {
        dates_filled: 1,
        date_filter_count: 2,
        has_range: false,
        site_id: 12,
        is_date_filters_enabled: true,
      },
    )
  })

  it("records a blocked item date save", () => {
    // Arrange / Act
    captureCollectionItemDateSaveBlocked({
      ...context,
      datesFilled: 0,
      dateFilterCount: 1,
      hasRange: false,
    })

    // Assert
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith(
      "collection_item_date_save_blocked",
      {
        dates_filled: 0,
        date_filter_count: 1,
        has_range: false,
        site_id: 12,
        is_date_filters_enabled: true,
      },
    )
  })

  it("records a date-filter sort direction", () => {
    // Arrange / Act
    captureCollectionDateFilterSortSaved({ ...context, direction: "desc" })

    // Assert
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith(
      "collection_date_filter_sort_saved",
      {
        direction: "desc",
        site_id: 12,
        is_date_filters_enabled: true,
      },
    )
  })
})
