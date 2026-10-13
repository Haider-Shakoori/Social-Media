import { canQueueProductionPublishing, type PublishingEligibility, type SocialNetwork } from './index';

export type ConnectorCapability = 'text' | 'image' | 'video' | 'analytics';
export type ConnectionMode = 'official' | 'experimental' | 'manual';

export interface ConnectorStatus {
  connected: boolean;
  error?: string;
  platformRestriction?: boolean;
}

export interface ContentToPublish {
  postId: string;
  postVersionId: string;
  socialConnectionId: string;
  caption: string;
  mediaUrls: readonly string[];
  idempotencyKey: string;
}

export interface PublishResponse {
  outcome: 'confirmed' | 'uncertain';
  remotePostId?: string;
}

export interface SocialConnector {
  readonly network: SocialNetwork;
  readonly mode: ConnectionMode;
  capabilities(): ReadonlySet<ConnectorCapability>;
  status(connectionId: string): Promise<ConnectorStatus>;
  validate(input: ContentToPublish): Promise<void>;
  publish(input: ContentToPublish): Promise<PublishResponse>;
  reconcile(input: { idempotencyKey: string; connectionId: string }): Promise<PublishResponse | null>;
  disconnect(connectionId: string): Promise<void>;
}

export class ConnectorUnavailableError extends Error {
  constructor(network: SocialNetwork) {
    super(`No authorized publishing connector is enabled for ${network}`);
    this.name = 'ConnectorUnavailableError';
  }
}

/** Adapters are registered explicitly; absence is a safe default. */
export class SocialConnectorRegistry {
  private readonly adapters = new Map<SocialNetwork, SocialConnector>();

  register(adapter: SocialConnector): void {
    if (this.adapters.has(adapter.network)) {
      throw new Error(`Duplicate provider registered: ${adapter.network}`);
    }
    this.adapters.set(adapter.network, adapter);
  }

  getForProduction(network: SocialNetwork, eligibility: PublishingEligibility): SocialConnector {
    if (!canQueueProductionPublishing(eligibility)) {
      throw new ConnectorUnavailableError(network);
    }
    const adapter = this.adapters.get(network);
    if (!adapter || adapter.mode !== 'official') {
      throw new ConnectorUnavailableError(network);
    }
    return adapter;
  }

  list(): ReadonlyArray<{ network: SocialNetwork; mode: ConnectionMode }> {
    return [...this.adapters.values()].map((adapter) => ({
      network: adapter.network, mode: adapter.mode,
    }));
  }
}
