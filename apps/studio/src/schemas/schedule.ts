import { add, format, isBefore, isValid, set, startOfDay } from "date-fns"
import { fromZonedTime } from "date-fns-tz"
import { z } from "zod"

import { parseTimeStringToDate } from "~/components/Select/TimeSelect"
import { basePageSchema } from "./page"

export const MINIMUM_SCHEDULE_LEAD_TIME_MINUTES = 2

/**
 * This schema includes the publish date and time for the scheduled publication
 */
export const schedulePublishClientSchema = basePageSchema
  .extend({
    publishDate: z.date(),
    publishTime: z.string().refine((time) => {
      // check that time is in HH:mm format
      const parsed = parseTimeStringToDate(time)
      return isValid(parsed) && format(parsed, "HH:mm") === time
    }),
  })
  .transform((schema) => {
    const { publishDate, publishTime, ...rest } = schema
    // combine publishDate and publishTime into a single Date object
    const [hours, minutes] = publishTime.split(":").map(Number)
    return {
      ...rest,
      scheduledAt: fromZonedTime(
        set(publishDate, {
          hours,
          minutes,
          seconds: 0,
          milliseconds: 0,
        }),
        "Asia/Singapore",
      ),
    }
  })
  .superRefine((schema, ctx) => {
    const { scheduledAt } = schema
    const earliestScheduleTime = add(new Date(), {
      minutes: MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
    })
    const isDateBeforeToday =
      startOfDay(scheduledAt) < startOfDay(earliestScheduleTime)
    // if the scheduled date is before the earliest allowable date, show error on publishDate
    if (isBefore(scheduledAt, earliestScheduleTime)) {
      ctx.addIssue({
        path: isDateBeforeToday ? ["publishDate"] : ["publishTime"],
        code: z.ZodIssueCode.custom,
        message: "Date can't be in the past",
      })
    }
  })

export const scheduledPublishServerSchema = basePageSchema.extend({
  scheduledAt: z.date(),
})
