import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SocialConnectorRegistry } from '@social/shared';
import { processConnectorJob, type ConnectorWorkerJob } from './processor';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL must be configured before starting connector workers');
}
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const registry = new SocialConnectorRegistry(); // No production providers registered in foundation.

const worker = new Worker<ConnectorWorkerJob>(
  'social-connectors',
  async (job) => processConnectorJob(job.data, registry),
  { connection, concurrency: 2 },
);

worker.on('completed', (job) => console.info('Connector operation completed', { id: job.id, name: job.name }));
worker.on('failed', (job, error) => console.error('Connector operation failed', { id: job?.id, error: error.message }));

async function shutdown(): Promise<void> {
  await worker.close();
  await connection.quit();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => { void shutdown().catch((error) => {
    console.error('Connector shutdown failed', error);
    process.exitCode = 1;
  }); });
}
