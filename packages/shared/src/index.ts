export type SocialNetwork = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'x' | 'reddit';
export type ConnectorMode = 'official' | 'experimental' | 'manual';
export type PolicyStatus = 'approved' | 'review_required' | 'prohibited';
export type ConnectionStatus = 'connected' | 'disconnected' | 'limited' | 'restricted';
export interface PublishingEligibility {
  mode: ConnectorMode;
  policyStatus: PolicyStatus;
  connectionStatus: ConnectionStatus;
  publishingPermissionVerified: boolean;
  providerEnabled: boolean;
  accountPaused: boolean;
  supportsPublishing: boolean;
}
/** Defense-in-depth guard: no unofficial automatic publishing for paying customers. */
export function canQueueProductionPublishing(input: PublishingEligibility): boolean {
  return input.mode === 'official' &&
    input.policyStatus === 'approved' &&
    input.connectionStatus === 'connected' &&
    input.publishingPermissionVerified &&
    input.providerEnabled &&
    !input.accountPaused &&
    input.supportsPublishing;
}
