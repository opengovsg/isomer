import { add, format, isBefore, isValid, set, startOfDay } from "date-fns"
import { z } from "zod"
import { parseTimeStringToDate } from "~/components/Select/TimeSelect"

import { basePageSchema } from "./page"

export const MINIMUM_SCHEDULE_LEAD_TIME_MINUTES = 2

// Publish/unpublish client schemas only differ in their date/time field
// names (so each flow's form fields read naturally) — the actual validation
// logic below is shared so the two definitions can't drift apart.
const isValidTimeString = (time: string) => {
  const parsed = parseTimeStringToDate(time)
  return isValid(parsed) && format(parsed, "HH:mm") === time
}

const combineDateAndTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number)
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 })
}

// If the combined scheduledAt is earlier than the minimum lead time, attach
// the error to the date field (if the date itself is in the past) or the
// time field (if only the time is too soon).
const refineScheduleLeadTime =
  (dateField: string, timeField: string) =>
  ({ scheduledAt }: { scheduledAt: Date }, ctx: z.RefinementCtx) => {
    const earliestScheduleTime = add(new Date(), {
      minutes: MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
    })
    const isDateBeforeToday =
      startOfDay(scheduledAt) < startOfDay(earliestScheduleTime)
    if (isBefore(scheduledAt, earliestScheduleTime)) {
      ctx.addIssue({
        path: [isDateBeforeToday ? dateField : timeField],
        code: z.ZodIssueCode.custom,
        message: "Date can't be in the past",
      })
    }
  }

/**
 * This schema includes the publish date and time for the scheduled publication
 */
export const schedulePublishClientSchema = basePageSchema
  .extend({
    publishDate: z.date(),
    publishTime: z.string().refine(isValidTimeString),
  })
  .transform((schema) => {
    const { publishDate, publishTime, ...rest } = schema
    return {
      ...rest,
      scheduledAt: combineDateAndTime(publishDate, publishTime),
    }
  })
  .superRefine(refineScheduleLeadTime("publishDate", "publishTime"))

/**
 * This schema includes the unpublish date and time for the scheduled unpublication
 */
export const scheduleUnpublishClientSchema = basePageSchema
  .extend({
    unpublishDate: z.date(),
    unpublishTime: z.string().refine(isValidTimeString),
  })
  .transform((schema) => {
    const { unpublishDate, unpublishTime, ...rest } = schema
    return {
      ...rest,
      scheduledAt: combineDateAndTime(unpublishDate, unpublishTime),
    }
  })
  .superRefine(refineScheduleLeadTime("unpublishDate", "unpublishTime"))

export const scheduledPublishServerSchema = basePageSchema.extend({
  scheduledAt: z.date(),
})

export const scheduledUnpublishServerSchema = basePageSchema.extend({
  scheduledAt: z.date(),
})
