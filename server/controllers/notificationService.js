const config = require('../config');

/**
 * Dispatches simulated notifications to allocated agents in batches of at most 10.
 * [FR-2 / NFR-3 / TC-DLD-BVA-08]
 * 
 * Rules:
 * - Maximum 10 recipients per batch.
 * - Recipient lists > 10 are partitioned into multiple sequential batches.
 */
function dispatchBatchNotifications(recipients, fileDetails) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { batches: [], totalRecipients: 0, totalBatches: 0 };
  }

  const batchLimit = config.EMAIL_BATCH_LIMIT; // 10
  const batches = [];

  for (let i = 0; i < recipients.length; i += batchLimit) {
    const batchSlice = recipients.slice(i, i + batchLimit);
    batches.push({
      batchNumber: batches.length + 1,
      recipientCount: batchSlice.length,
      recipients: batchSlice,
      timestamp: new Date().toISOString(),
      status: 'DISPATCHED'
    });
  }

  return {
    totalRecipients: recipients.length,
    totalBatches: batches.length,
    batchLimit,
    batches
  };
}

module.exports = {
  dispatchBatchNotifications
};

