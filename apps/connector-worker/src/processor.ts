import { SocialConnectorRegistry, type SocialNetwork } from '@social/shared';

/**
 * The connector worker is intentionally "fail-closed" at this stage.
 * A publish job cannot take a client-declared eligibility boolean as proof of
 * authorization. Production release requires a tenant-scoped database lookup,
 * immutable approval verification and connector permissions before sending.
 */
export type ConnectorWorkerJob =
  | { operation: 'capabilities'; network: SocialNetwork }
  | { operation: 'publish'; targetId: string };

export async function processConnectorJob(
  job: ConnectorWorkerJob,
  registry: SocialConnectorRegistry,
): Promise<{ network?: SocialNetwork; available: boolean; reason: string }> {
  if (job.operation === 'capabilities') {
    const entry = registry.list().find((x) => x.network === job.network);
    return {
      network: job.network,
      available: false,
      reason: entry ? 'Connector registered but not authorized for production' : 'No production connector configured',
    };
  }

  // Must never publish using only caller-controlled job metadata.
  throw new Error('Publishing disabled: persistent authorization and approval verification are not implemented');
}
