const db = require('../db');

/**
 * Validates date range filters.
 * [FR-4 / TC-DLD-EP-04]
 */
function validateDateRange(startDateStr, endDateStr) {
  if (!startDateStr && !endDateStr) {
    return { valid: true };
  }

  if ((startDateStr && !endDateStr) || (!startDateStr && endDateStr)) {
    return { valid: false, error: 'Both start date and end date must be provided.' };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format.' };
  }

  // Set end of day for end date comparison if only YYYY-MM-DD
  if (endDateStr.length <= 10) {
    end.setHours(23, 59, 59, 999);
  }

  const now = new Date();
  if (start > now || end > now) {
    return { valid: false, error: 'Date cannot be in the future.' };
  }

  if (start > end) {
    return { valid: false, error: 'Invalid date filter: Start date cannot be later than end date.' };
  }

  return { valid: true, start, end };
}

/**
 * Retrieves audit trail logs with filtering.
 * [FR-4 / TC-DLD-EP-04]
 */
exports.getAuditLogs = (req, res) => {
  const { startDate, endDate, actionType, actorId } = req.query;

  // Validate date filter [TC-DLD-EP-04]
  if (startDate || endDate) {
    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.valid) {
      return res.status(400).json({
        error: dateValidation.error,
        statusCode: 400
      });
    }
  }

  let filtered = [...db.auditLogs];

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (endDate.length <= 10) end.setHours(23, 59, 59, 999);

    filtered = filtered.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
  }

  if (actionType) {
    filtered = filtered.filter(log => log.actionType === actionType);
  }

  if (actorId) {
    filtered = filtered.filter(log => log.actorId === actorId);
  }

  return res.json({
    total: filtered.length,
    logs: filtered
  });
};

module.exports.validateDateRange = validateDateRange;

