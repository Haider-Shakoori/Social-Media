import assert from 'node:assert/strict';
import test from 'node:test';
import { SocialConnectorRegistry } from '@social/shared';
import { processConnectorJob } from '../src/processor';

test('unconfigured connection reports unavailable', async () => {
  const registry = new SocialConnectorRegistry();
  const result = await processConnectorJob({ operation: 'capabilities', network: 'instagram' }, registry);
  assert.deepEqual(result, {
    network: 'instagram',
    available: false,
    reason: 'No production connector configured',
  });
});

test('no queued publish is permitted before persistent auth checks exist', async () => {
  const registry = new SocialConnectorRegistry();
  await assert.rejects(
    processConnectorJob({ operation: 'publish', targetId: 'test-only' }, registry),
    /Publishing disabled/,
  );
});
