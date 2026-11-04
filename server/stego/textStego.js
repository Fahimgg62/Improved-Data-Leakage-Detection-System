const config = require('../config');
const { validateTrackingToken } = require('./tokenValidator');

const ZW_ZERO = '\u200B';   // Zero-Width Space represents '0'
const ZW_ONE = '\u200C';    // Zero-Width Non-Joiner represents '1'
const ZW_START = '\uFEFF\u200D'; // Byte Order Mark + ZWJ as opening synchronization marker
const ZW_END = '\u200D\uFEFF';   // ZWJ + BOM as closing synchronization marker

/**
 * Counts words in a plain text document.
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Converts text string to binary string (8 bits per character).
 */
function stringToBinary(str) {
  return str
    .split('')
    .map(ch => ch.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

/**
 * Converts binary string back to text string.
 */
function binaryToString(bin) {
  let result = '';
  for (let i = 0; i < bin.length; i += 8) {
    const byteStr = bin.slice(i, i + 8);
    if (byteStr.length === 8) {
      result += String.fromCharCode(parseInt(byteStr, 2));
    }
  }
  return result;
}

/**
 * Embeds a tracking token into a cover text document.
 * [FR-3 / TC-DLD-BVA-04]
 * 
 * Enforces:
 * - Minimum 50 words cover text requirement.
 * - Valid 36-char UUID token.
 */
function embedInText(coverText, trackingToken) {
  // Validate token
  const tokenValidation = validateTrackingToken(trackingToken);
  if (!tokenValidation.valid) {
    throw new Error(`Token validation failed: ${tokenValidation.reason}`);
  }

  // Check word count boundary [FR-3 / BVA-04]
  const wordCount = countWords(coverText);
  if (wordCount < config.MIN_TEXT_WORDS) {
    throw new Error(
      `Steganographic embedding error: Cover text contains ${wordCount} words, but a minimum of ${config.MIN_TEXT_WORDS} words is required to encode the tracking token.`
    );
  }

  // Convert token to zero-width bitstream
  const binaryPayload = stringToBinary(trackingToken);
  let zeroWidthStream = ZW_START;
  for (let bit of binaryPayload) {
    zeroWidthStream += bit === '0' ? ZW_ZERO : ZW_ONE;
  }
  zeroWidthStream += ZW_END;

  // Distribute after the first sentence or end of first paragraph for natural steganography
  const lines = coverText.split('\n');
  if (lines.length > 0) {
    lines[0] = lines[0] + zeroWidthStream;
    return lines.join('\n');
  }

  return coverText + zeroWidthStream;
}

/**
 * Extracts embedded tracking token from a text document.
 * [FR-5]
 */
function extractFromText(stegoText) {
  if (!stegoText || typeof stegoText !== 'string') {
    return {
      found: false,
      reason: 'Empty or invalid text provided'
    };
  }

  const startIdx = stegoText.indexOf(ZW_START);
  const endIdx = stegoText.indexOf(ZW_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return {
      found: false,
      reason: 'No steganographic zero-width payload markers detected in document'
    };
  }

  const encodedPayload = stegoText.substring(startIdx + ZW_START.length, endIdx);
  let binary = '';
  for (let ch of encodedPayload) {
    if (ch === ZW_ZERO) binary += '0';
    else if (ch === ZW_ONE) binary += '1';
  }

  if (binary.length < 36 * 8) {
    return {
      found: false,
      reason: 'Extracted bitstream is too short to reconstruct a valid tracking token'
    };
  }

  const extractedToken = binaryToString(binary.slice(0, 36 * 8));
  return {
    found: true,
    token: extractedToken,
    binaryLength: binary.length,
    rawBinary: binary
  };
}

module.exports = {
  countWords,
  embedInText,
  extractFromText
};

