import type { Logger } from "pino";

type PinoLogger = Logger<string>;

export interface HeartbeatOptions {
  maxRetries?: number;
  delayMs?: number;
  heartbeatURL: string;
}
/**
 * Send heartbeat signals to a specified URL with retry logic
 * Do NOT log the heartbeat URL to avoid sensitive data exposure (e.g., since it contains a heartbeat token)
 * @param logger Logger instance for logging
 * @param jobId Identifier for the job
 * @param options Configuration options for the heartbeat
 */
export const sendHeartbeat = async (
  logger: PinoLogger,
  jobId: string,
  { maxRetries = 3, delayMs = 1000, heartbeatURL }: HeartbeatOptions
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(heartbeatURL, { method: "POST" });
      if (!response.ok) {
        throw new Error(
          `Sending heartbeat URL failed with status: ${response.status}`
        );
      }
      logger.info(
        { jobId },
        `Successfully sent heartbeat for job attempt ${attempt}`
      );
      return;
    } catch (error) {
      logger.error(
        { error, jobId },
        `Error sending heartbeat for job attempt ${attempt}`
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        logger.error(
          { jobId },
          `Max retries of ${maxRetries} reached, failed to send heartbeat for job`
        );
      }
    }
  }
};
