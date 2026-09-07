import { add, format, isBefore, isValid, set, startOfDay } from "date-fns"
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
      scheduledAt: set(publishDate, {
        hours,
        milliseconds: 0,
        minutes,
        seconds: 0,
      }),
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
        code: "custom",
        message: "Date can't be in the past",
        path: isDateBeforeToday ? ["publishDate"] : ["publishTime"],
      })
    }
  })

export const scheduledPublishServerSchema = basePageSchema.extend({
  scheduledAt: z.date(),
})
