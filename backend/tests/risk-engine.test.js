import test from 'node:test';
import assert from 'node:assert';
import { RiskEngineService } from '../src/modules/risk/risk-engine.service.js';

test('RiskEngineService Normalization', (t) => {
  // Anxiety
  assert.strictEqual(RiskEngineService._normalizeAnxiety(8), 80);
  assert.strictEqual(RiskEngineService._normalizeAnxiety(null), 50);

  // Stress
  assert.strictEqual(RiskEngineService._normalizeStress(7), 70);

  // Inverse Mood
  assert.strictEqual(RiskEngineService._inverseMood(8), 20);
  assert.strictEqual(RiskEngineService._inverseMood(2), 80);

  // Sleep Risk
  assert.strictEqual(RiskEngineService._sleepRisk(9), 10);
  assert.strictEqual(RiskEngineService._sleepRisk(3), 70);

  // Task Avoid
  assert.strictEqual(RiskEngineService._calculateTaskAvoid({ assigned: 10, skipped: 2, expired: 2 }), 40);
  assert.strictEqual(RiskEngineService._calculateTaskAvoid({ assigned: 0 }), 0);

  // Journal Negativity
  assert.strictEqual(RiskEngineService._calculateJournalNegativity(-1), 100);
  assert.strictEqual(RiskEngineService._calculateJournalNegativity(0), 50);
  assert.strictEqual(RiskEngineService._calculateJournalNegativity(1), 0);
  assert.strictEqual(RiskEngineService._calculateJournalNegativity(null), 30);

  // Emergency Frequency
  assert.strictEqual(RiskEngineService._calculateEmergencyFrequency(3), 60);
  assert.strictEqual(RiskEngineService._calculateEmergencyFrequency(10), 100);
});

test('Risk Classification', (t) => {
  assert.strictEqual(RiskEngineService._classifyRisk(10), 'low');
  assert.strictEqual(RiskEngineService._classifyRisk(35), 'moderate');
  assert.strictEqual(RiskEngineService._classifyRisk(60), 'high');
  assert.strictEqual(RiskEngineService._classifyRisk(85), 'critical');
});
