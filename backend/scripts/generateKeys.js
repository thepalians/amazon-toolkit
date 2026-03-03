#!/usr/bin/env node
/**
 * Generate Amazon Seller Toolkit activation keys
 * Usage: node generateKeys.js <plan_type> <duration_months> <quantity> <batch_id>
 * Example: node generateKeys.js professional 12 100 BATCH-001
 */

const crypto = require('crypto');
const { sequelize } = require('../config/database');
const ActivationKey = require('../models/ActivationKey');

const VALID_PLANS = ['starter', 'professional', 'enterprise'];

function generateKeyCode() {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `AST-${part()}-${part()}-${part()}`;
}

async function main() {
  const [,, planType, durationMonths, quantity, batchId] = process.argv;

  if (!planType || !durationMonths || !quantity || !batchId) {
    console.error('Usage: node generateKeys.js <plan_type> <duration_months> <quantity> <batch_id>');
    console.error('Example: node generateKeys.js professional 12 100 BATCH-001');
    process.exit(1);
  }

  if (!VALID_PLANS.includes(planType)) {
    console.error(`Invalid plan_type. Must be one of: ${VALID_PLANS.join(', ')}`);
    process.exit(1);
  }

  const count = Math.max(1, parseInt(quantity, 10));
  const months = Math.max(1, parseInt(durationMonths, 10));

  try {
    await sequelize.authenticate();
    console.log(`Generating ${count} activation key(s) for plan "${planType}" (${months} months), batch "${batchId}"...`);

    const generated = [];
    for (let i = 0; i < count; i++) {
      let keyCode;
      let exists = true;
      while (exists) {
        keyCode = generateKeyCode();
        exists = await ActivationKey.findOne({ where: { key_code: keyCode } });
      }
      const key = await ActivationKey.create({
        key_code: keyCode,
        plan_type: planType,
        duration_months: months,
        batch_id: batchId,
      });
      generated.push(key.key_code);
      console.log(key.key_code);
    }

    console.log(`\nSuccessfully generated ${generated.length} key(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Error generating keys:', err.message);
    process.exit(1);
  }
}

main();
