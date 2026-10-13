import assert from 'node:assert/strict';
import test from 'node:test';
import { canQueueProductionPublishing, type PublishingEligibility } from '../src/index';

const eligible: PublishingEligibility = {
  mode: 'official', policyStatus: 'approved', connectionStatus: 'connected',
  publishingPermissionVerified: true, providerEnabled: true, accountPaused: false,
  supportsPublishing: true,
};

test('authorized official provider can enter production publication queue', () => {
  assert.equal(canQueueProductionPublishing(eligible), true);
});

test('experimental or manual connector cannot enter production queue', () => {
  for (const mode of ['experimental', 'manual'] as const) {
    assert.equal(canQueueProductionPublishing({ ...eligible, mode }), false);
  }
});

test('unverified rights, provider disable and account restriction block publishing', () => {
  assert.equal(canQueueProductionPublishing({ ...eligible, policyStatus: 'review_required' }), false);
  assert.equal(canQueueProductionPublishing({ ...eligible, publishingPermissionVerified: false }), false);
  assert.equal(canQueueProductionPublishing({ ...eligible, accountPaused: true }), false);
  assert.equal(canQueueProductionPublishing({ ...eligible, providerEnabled: false }), false);
  assert.equal(canQueueProductionPublishing({ ...eligible, connectionStatus: 'restricted' }), false);
  assert.equal(canQueueProductionPublishing({ ...eligible, supportsPublishing: false }), false);
});
