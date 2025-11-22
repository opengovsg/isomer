import type { Job, ScheduleOptions } from "pg-boss";
import { PgBoss } from "pg-boss";
import { env } from "./env";
import type { pino } from "pino";

/* Singleton pattern using global for dev hot reload */
const globalForPgboss = global as unknown as {
  pgBoss: PgBoss | undefined;
  registeredPgbossJobs: Set<string>;
};

const createPgbossClient = async (
  logger: pino.Logger<string>
): Promise<PgBoss> => {
  const boss = new PgBoss({ connectionString: env.DATABASE_URL });
  boss.on("error", (err) => logger.error("Pgboss client error", err));
  await boss.start();
  logger.info("PgBoss client started");
  return boss;
};

const getPgbossClient = async (
  logger: pino.Logger<string>
): Promise<PgBoss> => {
  const boss = globalForPgboss.pgBoss ?? (await createPgbossClient(logger));
  globalForPgboss.pgBoss = boss;
  return boss;
};

export const registerPgbossJob = async <T extends object>(
  logger: pino.Logger<string>,
  jobName: string,
  cronExpression: string,
  handler: (job: Job<T>) => Promise<void>,
  options: ScheduleOptions = { tz: "Asia/Singapore" },
  // TODO: move logger to its own package
  data?: T
) => {
  const boss = await getPgbossClient(logger);
  if (globalForPgboss.registeredPgbossJobs.has(jobName)) {
    logger.warn(
      `Pgboss job ${jobName} is already registered. Skipping registration.`
    );
    return { stop: () => boss.offWork(jobName) };
  }
  // Ensure the queue exists, else create it
  const queue = await boss.getQueue(jobName);
  if (!queue) await boss.createQueue(jobName);
  // Set up the worker to process jobs
  await boss.work(jobName, async ([job]: Job<T>[]) => {
    if (!job) {
      logger.warn(`No job found for job name ${jobName}`);
      return;
    }
    logger.info(`Received job ${job.id} with data ${JSON.stringify(job.data)}`);
    try {
      await handler(job);
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  });
  // Schedule the job
  await boss.schedule(jobName, cronExpression, data, options);
  globalForPgboss.registeredPgbossJobs.add(jobName);
  logger.info(
    `Registered PgBoss job: ${jobName} with schedule ${cronExpression}`
  );
  return { stop: () => boss.offWork(jobName) };
};

export const stopAllPgbossJobs = async (
  logger: pino.Logger<string>
): Promise<void> => {
  const boss = await getPgbossClient(logger);
  try {
    await boss.stop({ graceful: true });
    logger.info("PgBoss client stopped");
  } catch (error) {
    logger.error("Error stopping PgBoss client:", error);
    throw error;
  } finally {
    globalForPgboss.pgBoss = undefined;
    globalForPgboss.registeredPgbossJobs = new Set<string>();
    logger.info("Cleared PgBoss client and registered jobs");
  }
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
globalForPgboss.registeredPgbossJobs ||= new Set<string>();
