import type { DateFilterStatusId } from "~/types/constants"

interface DateFilterStatusLabel {
  id: DateFilterStatusId
  label: string
}

// NOTE: server-precomputed display fields for a date filter (label + formatted
// date text + admin status labels). Live status is derived on the client.
export interface DateFilterDisplayEntry {
  id: string
  label: string
  dateText: string
  date: string
  endDate?: string
  statusLabels: DateFilterStatusLabel[]
}

// NOTE: fully resolved card display entry, including live status — only
// produced on the client (see DateFilterStatusClient).
export interface DateFilterCard {
  id: string
  label: string
  status: DateFilterStatusId
  statusLabel: string
  dateText: string
}
