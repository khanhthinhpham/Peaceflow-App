import 'dotenv/config';
import { RiskEngineService } from '../modules/risk/risk-engine.service.js';
import { RecommendationEngineService } from '../modules/risk/recommendation-engine.service.js';
import { db } from '../config/db.js';

async function testEngines() {
  console.log('--- Testing Risk & Recommendation Engines ---');

  try {
    // 1. Find a test user
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found in database. Please create a user first.');
      return;
    }
    const userId = userRes.rows[0].id;
    console.log(`Using test user ID: ${userId}`);

    // 2. Calculate Stress Index
    console.log('\n[1] Calculating Stress Index...');
    const riskResult = await RiskEngineService.calculateStressIndex(userId);
    console.log('Stress Calculation Result:');
    console.log(JSON.stringify(riskResult, null, 2));

    // 3. Recommend Tasks
    console.log('\n[2] Generating Task Recommendations...');
    const recResult = await RecommendationEngineService.recommendTasks(userId);
    console.log('Recommendation Result (Buckets):');
    console.log({
      emergency: recResult.emergency_task?.title,
      priority: recResult.today_priority_tasks.map(t => t.title),
      micro: recResult.micro_task?.title,
      long_term: recResult.long_term_task?.title,
      risk_level: recResult.risk_summary.risk_level
    });

    console.log('\n--- Test Complete ---');
  } catch (error) {
    console.error('\nTest failed:', error);
  } finally {
    await db.end();
  }
}

testEngines();
