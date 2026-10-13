import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ConnectorUnavailableError,
  SocialConnectorRegistry,
  type SocialConnector,
  type PublishingEligibility,
} from '../src/index';

const eligibility: PublishingEligibility = {
  mode: 'official', policyStatus: 'approved', connectionStatus: 'connected',
  publishingPermissionVerified: true, providerEnabled: true,
  accountPaused: false, supportsPublishing: true,
};
function createOfficialFake(): SocialConnector {
  return {
    network: 'instagram', mode: 'official',
    capabilities: () => new Set(['image'] as const),
    status: async () => ({ connected: true }),
    validate: async () => {},
    publish: async () => ({ outcome: 'confirmed', remotePostId: 'fake-test-only' }),
    reconcile: async () => null,
    disconnect: async () => {},
  };
}

test('registered official adapter can be selected with complete eligibility', () => {
  const registry = new SocialConnectorRegistry();
  const fake = createOfficialFake();
  registry.register(fake);
  assert.equal(registry.getForProduction('instagram', eligibility), fake);
});

test('unregistered and experimental connectors are not eligible', () => {
  const registry = new SocialConnectorRegistry();
  assert.throws(() => registry.getForProduction('instagram', eligibility), ConnectorUnavailableError);
  const experimental = { ...createOfficialFake(), mode: 'experimental' as const };
  registry.register(experimental);
  assert.throws(() => registry.getForProduction('instagram', eligibility), ConnectorUnavailableError);
});

test('operator kill switch blocks an otherwise eligible adapter', () => {
  const registry = new SocialConnectorRegistry();
  registry.register(createOfficialFake());
  assert.throws(() => registry.getForProduction('instagram', { ...eligibility, providerEnabled: false }), ConnectorUnavailableError);
});

test('duplicate adapter registration is rejected', () => {
  const registry = new SocialConnectorRegistry();
  registry.register(createOfficialFake());
  assert.throws(() => registry.register(createOfficialFake()), /Duplicate provider/);
});
