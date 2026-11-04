const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Validates tracking token format according to RFC 4122 UUID v4.
 * [FR-3 / TC-DLD-EP-02]
 * 
 * Rules:
 * 1. Must be exact 36 characters length.
 * 2. Must adhere to 8-4-4-4-12 hex format with hyphens.
 * 3. 13th character must be '4' (version 4).
 * 4. 17th character must be in [8, 9, a, b] (variant 1).
 */
function validateTrackingToken(token) {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      reason: 'Missing or non-string tracking token'
    };
  }

  if (token.length !== 36) {
    return {
      valid: false,
      reason: `Invalid UUID token length: expected exactly 36 characters, received ${token.length}`
    };
  }

  // Canonical UUID format check
  const canonicalRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!canonicalRegex.test(token)) {
    if (!token.includes('-')) {
      return {
        valid: false,
        reason: 'Malformed canonical format: missing hyphen delimiters'
      };
    }
    const nonHexMatch = token.replace(/-/g, '').match(/[^0-9a-f]/i);
    if (nonHexMatch) {
      return {
        valid: false,
        reason: `Non-hexadecimal characters detected: '${nonHexMatch[0]}'`
      };
    }
    return {
      valid: false,
      reason: 'Token does not conform to RFC 4122 UUID v4 specifications'
    };
  }

  return {
    valid: true,
    token: token.toLowerCase()
  };
}

function generateTrackingToken() {
  return uuidv4();
}

module.exports = {
  validateTrackingToken,
  generateTrackingToken
};

