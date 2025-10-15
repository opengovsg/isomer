import type { Job, JobsOptions } from "bullmq"
import type pino from "pino"

import {
  REMOVE_ON_COMPLETE_BUFFER,
  REMOVE_ON_FAIL_BUFFER,
  WORKER_RETRY_LIMIT,
} from "./constants"

/**
 * Get the job ID for a scheduled publish job
 * NOTE: job IDs must be unique per queue, so we include the scheduledAt timestamp to ensure uniqueness
 * This is because we might enqueue jobs which are STILL active (ie publishing is in progress), since
 * we 'claim' the job before the publishing completes
 * @param resourceId The id of the resource to be published
 * @param scheduledAt The date and time when the job is scheduled to run
 * @returns The job ID for the scheduled publish job
 */
export const getJobIdFromResourceIdAndScheduledAt = (
  resourceId: string,
  scheduledAt: Date,
) => `resource-${resourceId}-${scheduledAt.getTime()}`

/**
 * Get job options for a scheduled publish job
 * @param resourceId The id of the resource to be published
 * @param scheduledAt The date and time when the job is scheduled to run
 * @returns The job options for the scheduled publish job
 */
export const getJobOptionsFromScheduledAt = (
  resourceId: string,
  scheduledAt: Date,
  delayMs: number,
): JobsOptions => {
  return {
    attempts: WORKER_RETRY_LIMIT,
    removeOnComplete: { age: REMOVE_ON_COMPLETE_BUFFER },
    removeOnFail: { age: REMOVE_ON_FAIL_BUFFER },
    jobId: getJobIdFromResourceIdAndScheduledAt(resourceId, scheduledAt),
    delay: delayMs,
  }
}

/**
 * Handle a failed job by logging the error and invoking the onFinalFailure callback if provided
 * @param job The job that failed
 * @param logger The logger instance to use for logging
 * @param err The error that caused the job to fail
 * @param options Options for handling the failed job
 * @returns A promise that resolves when the failed job has been handled
 */
export const handleFailedJob = async <T>(
  job: Job<T> | undefined,
  logger: pino.Logger<string>,
  err: Error,
  options: {
    workerName: string
    retryLimit: number
    onFinalFailure?: (job: Job<T>) => Promise<void>
  },
) => {
  const { workerName, retryLimit, onFinalFailure } = options
  if (!job) {
    logger.error({
      message: `Job is undefined in failed event (${workerName})`,
      error: err,
    })
    return
  }
  logger.error({
    message:
      job.attemptsMade >= retryLimit
        ? `${workerName}: Job ${job.id} has failed ${retryLimit} or more times`
        : `${workerName}: Attempt ${job.attemptsMade} failed for job ${job.id}`,
    job,
    error: err,
  })
  if (job.attemptsMade < retryLimit) return
  try {
    if (onFinalFailure) {
      await onFinalFailure(job)
    }
  } catch (callbackErr) {
    logger.error({
      message: `${workerName}: Error running onFinalFailure handler for job ${job.id}`,
      error: callbackErr,
    })
  }
}
