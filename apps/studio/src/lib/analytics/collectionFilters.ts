import type {
  DateFilterSchemaType,
  TagCategoryType,
} from "@opengovsg/isomer-components"
import posthog from "posthog-js"

interface CollectionFilterAnalyticsContext {
  siteId: number
}

type DateFilterSavedProperties = Required<
  Pick<
    DateFilterSchemaType,
    "isRequired" | "showStatusLabelsFilter" | "showDateRangeFilter"
  >
> & {
  statusLabelsCustomized: boolean
}

const collectionFilterContext = ({
  siteId,
}: CollectionFilterAnalyticsContext) => ({
  site_id: siteId,
})

export const captureDateFilterOnboardingBannerSupportLinkClicked = (
  context: CollectionFilterAnalyticsContext,
) => {
  posthog.capture("date_filter_onboarding_banner_clicked", {
    ...collectionFilterContext(context),
  })
}

export const captureFilterCreated = ({
  filterType,
  ...context
}: CollectionFilterAnalyticsContext & { filterType: TagCategoryType }) => {
  posthog.capture("collection_filter_created", {
    ...collectionFilterContext(context),
    filter_type: filterType,
  })
}

export const captureDateFilterSaved = ({
  isRequired,
  showStatusLabelsFilter,
  showDateRangeFilter,
  statusLabelsCustomized,
  ...context
}: CollectionFilterAnalyticsContext & DateFilterSavedProperties) => {
  posthog.capture("date_filter_saved", {
    ...collectionFilterContext(context),
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
}: CollectionFilterAnalyticsContext & {
  datesFilled: number
  dateFilterCount: number
  hasRange: boolean
}) => {
  posthog.capture("collection_item_date_saved", {
    ...collectionFilterContext(context),
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
}: CollectionFilterAnalyticsContext & {
  datesFilled: number
  dateFilterCount: number
  hasRange: boolean
}) => {
  posthog.capture("collection_item_date_save_blocked", {
    ...collectionFilterContext(context),
    dates_filled: datesFilled,
    date_filter_count: dateFilterCount,
    has_range: hasRange,
  })
}

export const captureCollectionDateFilterSortSaved = ({
  direction,
  ...context
}: CollectionFilterAnalyticsContext & { direction: "asc" | "desc" }) => {
  posthog.capture("collection_date_filter_sort_saved", {
    ...collectionFilterContext(context),
    direction,
  })
}
