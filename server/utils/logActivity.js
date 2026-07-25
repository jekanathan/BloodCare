const ActivityLog = require('../models/ActivityLog');

/**
 * Records one activity log entry. Never throws — a logging failure should
 * never break the actual action (e.g. registering a patient) that triggered it.
 *
 * @param {ObjectId|String} hospitalId - the hospital this log belongs to
 * @param {String} module - one of ActivityLog's module enum values
 * @param {String} action - short action key, e.g. 'created', 'updated', 'deleted'
 * @param {String} description - human-readable summary, e.g. "Registered patient John Silva"
 * @param {ObjectId|String} [entityId] - id of the patient/request/etc this concerns
 */
async function logActivity(hospitalId, module, action, description, entityId) {
  try {
    await ActivityLog.create({ hospital: hospitalId, module, action, description, entityId });
  } catch (err) {
    console.error('Activity log write failed:', err.message);
  }
}

module.exports = logActivity;