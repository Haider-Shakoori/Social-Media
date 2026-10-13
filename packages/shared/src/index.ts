export const SOCIAL_NETWORKS = [
 'instagram','facebook','threads','pinterest','linkedin','tiktok','youtube',
 'google_business_profile','x','reddit',
] as const;
export type SocialNetwork = typeof SOCIAL_NETWORKS[number];
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
export function canQueueProductionPublishing(input: PublishingEligibility): boolean {
  return input.mode === 'official' &&
    input.policyStatus === 'approved' &&
    input.connectionStatus === 'connected' &&
    input.publishingPermissionVerified &&
    input.providerEnabled &&
    !input.accountPaused &&
    input.supportsPublishing;
}
export * from './connectors';
export * from './provider-catalog';
