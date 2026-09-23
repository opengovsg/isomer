import type {
  DateFilterSchemaType,
  TagCategoryType,
} from "@opengovsg/isomer-components"
import posthog from "posthog-js"

interface DateFilterAnalyticsContext {
  siteId: number
  isDateFiltersEnabled: boolean
}

type DateFilterSavedProperties = Required<
  Pick<
    DateFilterSchemaType,
    "isRequired" | "showStatusLabelsFilter" | "showDateRangeFilter"
  >
> & {
  statusLabelsCustomized: boolean
}

const dateFilterContext = ({
  siteId,
  isDateFiltersEnabled,
}: DateFilterAnalyticsContext) => ({
  site_id: siteId,
  is_date_filters_enabled: isDateFiltersEnabled,
})

export const captureDateFilterOnboardingBannerShown = (
  context: DateFilterAnalyticsContext,
) => {
  posthog.capture("date_filter_onboarding_banner", {
    ...dateFilterContext(context),
    action: "shown",
  })
}

export const captureDateFilterOnboardingBannerSupportLinkClicked = (
  context: DateFilterAnalyticsContext,
) => {
  posthog.capture("date_filter_onboarding_banner", {
    ...dateFilterContext(context),
    action: "support_link_clicked",
  })
}

export const captureDateFilterCreated = ({
  filterType,
  ...context
}: DateFilterAnalyticsContext & { filterType: TagCategoryType }) => {
  posthog.capture("date_filter_created", {
    ...dateFilterContext(context),
    filter_type: filterType,
  })
}

export const captureDateFilterSaved = ({
  isRequired,
  showStatusLabelsFilter,
  showDateRangeFilter,
  statusLabelsCustomized,
  ...context
}: DateFilterAnalyticsContext & DateFilterSavedProperties) => {
  posthog.capture("date_filter_saved", {
    ...dateFilterContext(context),
    is_required: isRequired,
    show_status_labels_filter: showStatusLabelsFilter,
    show_date_range_filter: showDateRangeFilter,
    status_labels_customized: statusLabelsCustomized,
  })
}

export const captureCollectionItemDateSaved = ({
  datesFilled,
  dateFilterCount,
  hasRange,
  ...context
}: DateFilterAnalyticsContext & {
  datesFilled: number
  dateFilterCount: number
  hasRange: boolean
}) => {
  posthog.capture("collection_item_date_saved", {
    ...dateFilterContext(context),
    dates_filled: datesFilled,
    date_filter_count: dateFilterCount,
    has_range: hasRange,
  })
}

export const captureCollectionItemDateSaveBlocked = ({
  datesFilled,
  dateFilterCount,
  hasRange,
  ...context
}: DateFilterAnalyticsContext & {
  datesFilled: number
  dateFilterCount: number
  hasRange: boolean
}) => {
  posthog.capture("collection_item_date_save_blocked", {
    ...dateFilterContext(context),
    dates_filled: datesFilled,
    date_filter_count: dateFilterCount,
    has_range: hasRange,
  })
}

export const captureCollectionDateFilterSortSaved = ({
  direction,
  ...context
}: DateFilterAnalyticsContext & { direction: "asc" | "desc" }) => {
  posthog.capture("collection_date_filter_sort_saved", {
    ...dateFilterContext(context),
    direction,
  })
}
