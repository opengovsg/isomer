import {
  add,
  format,
  isBefore,
  isValid,
  parse,
  set,
  startOfDay,
} from "date-fns"
import { fromZonedTime } from "date-fns-tz"
import { z } from "zod"

import { basePageSchema } from "./page"

export const MINIMUM_SCHEDULE_LEAD_TIME_MINUTES = 10

export enum PublishMode {
  NOW = "Now",
  SCHEDULED = "Scheduled",
}

/**
 * The schema for publishing the page immediately
 */
const nowPublishClientSchema = basePageSchema.extend({
  publishMode: z.enum([PublishMode.NOW]),
})

/**
 * This schema includes the publish date and time for the scheduled publication
 */
export const schedulePublishClientSchema = basePageSchema.extend({
  publishMode: z.enum([PublishMode.SCHEDULED]),
  publishDate: z.date(),
  publishTime: z.string().refine((time) => {
    // check that time is in HH:mm format
    const parsed = parse(time, "HH:mm", new Date())
    return isValid(parsed) && format(parsed, "HH:mm") === time
  }),
})

export const publishClientSchema = z
  .discriminatedUnion("publishMode", [
    nowPublishClientSchema,
    schedulePublishClientSchema,
  ])
  .transform((schema) => {
    if (schema.publishMode === PublishMode.NOW) return schema
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
    if (schema.publishMode === PublishMode.NOW) return
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
        message: `Earliest publish time allowable is ${format(earliestScheduleTime, "MMMM d, yyyy hh:mm a")}`,
      })
    }
  })

export const scheduledPublishServerSchema = basePageSchema.extend({
  scheduledAt: z.date(),
})
