import type { DateFilterDisplayEntry } from "~/interfaces/internal/DateFilter"
import { DATE_FILTER_STATUS, type DateFilterStatusId } from "~/types/constants"

export const buildDateFilterStatusLabels = (
  categoryLabels?: Partial<Record<DateFilterStatusId, string>>,
): DateFilterDisplayEntry["statusLabels"] =>
  Object.values(DATE_FILTER_STATUS).map(({ id, defaultLabel }) => ({
    id,
    label: categoryLabels?.[id] ?? defaultLabel,
  }))
