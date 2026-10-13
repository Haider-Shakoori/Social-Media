import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { HealthController } = require('../dist/health.controller.js');

test('health controller returns a truthful API-only readiness-free status', () => {
  const response = new HealthController().getHealth();
  assert.equal(response.status, 'ok');
  assert.equal(response.service, 'social-api');
  assert.ok(Number.isFinite(Date.parse(response.timestamp)));
  assert.equal(Object.hasOwn(response, 'database'), false);
});
