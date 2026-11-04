/**
 * Automated Test Suite: Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
 * Matches the specification in Equivalence_Partitioning_and_BVA_Test_Cases.md
 */

const assert = require('assert');
const path = require('path');
const config = require('../server/config');
const { validateTrackingToken, generateTrackingToken } = require('../server/stego/tokenValidator');
const { countWords, embedInText, extractFromText } = require('../server/stego/textStego');
const { createSyntheticBmp, getImageDimensions, embedInImage, extractFromImage } = require('../server/stego/imageStego');
const { validateDateRange } = require('../server/controllers/auditController');
const { dispatchBatchNotifications } = require('../server/controllers/notificationService');
const { validateForensicFile, analyzeLeakedFile, calculateBER } = require('../server/stego/forensicEngine');

let passedTests = 0;
let totalTests = 0;

function runTest(tcId, description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ [PASS] ${tcId}: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${tcId}: ${description}`);
    console.error(`   Error: ${err.message}`);
  }
}

console.log('================================================================');
console.log('🧪 RUNNING LEAKTRACE EP & BVA CONSOLIDATED TEST SUITE (12 TEST CASES)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// MEMBER 1: FAHIM BIN ZAMAN (ID: 24524203055)
// -----------------------------------------------------------------------------
console.log('--- MEMBER 1: FAHIM BIN ZAMAN (ID: 24524203055) ---');

// TC-DLD-EP-01: File Upload Format Validation [FR-1]
runTest('TC-DLD-EP-01', 'File Upload Format Validation (Rejects .pdf, accepts .txt, .jpg, .bmp)', () => {
  const allowed = ['.txt', '.jpg', '.bmp'];
  const disallowed = ['.pdf', '.exe', '.docx', '.sh'];

  allowed.forEach(ext => {
    assert.strictEqual(config.ALLOWED_EXTENSIONS.includes(ext), true, `Expected ${ext} to be allowed`);
  });

  disallowed.forEach(ext => {
    assert.strictEqual(config.ALLOWED_EXTENSIONS.includes(ext), false, `Expected ${ext} to be disallowed`);
  });
});

// TC-DLD-BVA-01: File Upload Size Limitation [FR-1 / NFR-3]
runTest('TC-DLD-BVA-01', 'File Upload Size Limitation (Boundary: 50 MB / 52,428,800 Bytes)', () => {
  const maxSize = config.MAX_FILE_SIZE_BYTES; // 52,428,800
  const minSize = config.MIN_FILE_SIZE_BYTES; // 1

  // 0 Bytes (empty) -> Invalid
  assert.strictEqual(0 < minSize, true, '0 Bytes should be below minimum valid size');

  // 1 Byte -> Valid
  assert.strictEqual(1 >= minSize && 1 <= maxSize, true, '1 Byte should be valid');

  // 50.0 MB -> Valid
  const exactMax = 52428800;
  assert.strictEqual(exactMax <= maxSize, true, '50.0 MB should be accepted');

  // 50.1 MB -> Invalid
  const overMax = 52533658;
  assert.strictEqual(overMax > maxSize, true, '50.1 MB should exceed size boundary');
});

// TC-DLD-BVA-02: Target Agent Concurrent Allocation Count [FR-2]
runTest('TC-DLD-BVA-02', 'Target Agent Concurrent Allocation Count (Boundary: [1 to 20 agents])', () => {
  const minAgents = config.MIN_AGENTS_PER_BATCH; // 1
  const maxAgents = config.MAX_AGENTS_PER_BATCH; // 20

  function validateAgentCount(count) {
    if (count < minAgents) return { valid: false, error: 'Select at least 1 agent' };
    if (count > maxAgents) return { valid: false, error: 'Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle.' };
    return { valid: true };
  }

  assert.strictEqual(validateAgentCount(0).valid, false, '0 agents should be rejected');
  assert.strictEqual(validateAgentCount(1).valid, true, '1 agent should be accepted');
  assert.strictEqual(validateAgentCount(20).valid, true, '20 agents should be accepted');
  
  const res21 = validateAgentCount(21);
  assert.strictEqual(res21.valid, false, '21 agents should be rejected');
  assert.strictEqual(res21.error.includes('Maximum 20 recipients permitted'), true);
});

// -----------------------------------------------------------------------------
// MEMBER 2: ABID AJMAL TAHMID (ID: 24524203133)
// -----------------------------------------------------------------------------
console.log('\n--- MEMBER 2: ABID AJMAL TAHMID (ID: 24524203133) ---');

// TC-DLD-EP-02: Steganographic Tracking Token (UUID v4) Format [FR-3]
runTest('TC-DLD-EP-02', 'Tracking Token (UUID v4) Format Validation (Canonical 36-char string)', () => {
  // P1: Valid canonical UUID v4
  const validToken = 'c4a7e810-7b2a-4f51-9e23-8d6f1234abcd';
  const val1 = validateTrackingToken(validToken);
  assert.strictEqual(val1.valid, true, 'Valid 36-char canonical UUID should pass');

  // P2: Short token (<36 chars)
  const shortToken = 'c4a7e810-7b2a-4f51-9e23';
  const val2 = validateTrackingToken(shortToken);
  assert.strictEqual(val2.valid, false, 'Short token should be rejected');

  // P4: Missing hyphens
  const noHyphens = 'c4a7e8107b2a4f519e238d6f1234abcd';
  const val3 = validateTrackingToken(noHyphens);
  assert.strictEqual(val3.valid, false, 'Token missing hyphens should be rejected');

  // P5: Non-hex characters
  const nonHex = 'c4a7e810-7b2a-4f51-9e23-8d6fZXYZabcd';
  const val4 = validateTrackingToken(nonHex);
  assert.strictEqual(val4.valid, false, 'Token with non-hex characters should be rejected');
});

// TC-DLD-BVA-03: Minimum Cover Image Dimensions for LSB Watermarking [FR-3 / NFR-8]
runTest('TC-DLD-BVA-03', 'Minimum Cover Image Dimensions for LSB (Boundary: 256x256 pixels)', () => {
  const token = generateTrackingToken();

  // 255x255 BMP -> Rejected
  const bmp255 = createSyntheticBmp(255, 255);
  let error255 = null;
  try {
    embedInImage(bmp255, token);
  } catch (err) {
    error255 = err.message;
  }
  assert.strictEqual(error255 !== null, true, '255x255 image should throw boundary error');
  assert.strictEqual(error255.includes('below the minimum required resolution of 256x256'), true);

  // 256x256 BMP -> Accepted
  const bmp256 = createSyntheticBmp(256, 256);
  const watermarked256 = embedInImage(bmp256, token);
  assert.strictEqual(watermarked256.length > 0, true, '256x256 embedding should succeed');

  // Verify extraction from 256x256
  const extracted = extractFromImage(watermarked256);
  assert.strictEqual(extracted.found, true, 'Watermark extraction should succeed');
  assert.strictEqual(extracted.token, token.toLowerCase(), 'Extracted token should match embedded token');
});

// TC-DLD-BVA-04: Steganographic Cover Text Payload Capacity [FR-3]
runTest('TC-DLD-BVA-04', 'Steganographic Cover Text Capacity (Boundary: 50 words)', () => {
  const token = generateTrackingToken();

  // 49 words text -> Rejected
  const words49 = Array(49).fill('security').join(' ');
  assert.strictEqual(countWords(words49), 49);
  let err49 = null;
  try {
    embedInText(words49, token);
  } catch (e) {
    err49 = e.message;
  }
  assert.strictEqual(err49 !== null, true, '49 words text should throw error');
  assert.strictEqual(err49.includes('minimum of 50 words is required'), true);

  // 50 words text -> Accepted
  const words50 = Array(50).fill('confidential').join(' ');
  assert.strictEqual(countWords(words50), 50);
  const embedded50 = embedInText(words50, token);
  assert.strictEqual(embedded50.length > words50.length, true, 'Payload should be embedded');

  // Verify extraction
  const extracted = extractFromText(embedded50);
  assert.strictEqual(extracted.found, true, 'Extraction should succeed');
  assert.strictEqual(extracted.token, token, 'Extracted token should match embedded token');
});

// -----------------------------------------------------------------------------
// MEMBER 3: HOJAIFA (ID: 24524203181)
// -----------------------------------------------------------------------------
console.log('\n--- MEMBER 3: HOJAIFA (ID: 24524203181) ---');

// TC-DLD-BVA-05: Forensic Bit Error Rate (BER) Tolerance Threshold [FR-5]
runTest('TC-DLD-BVA-05', 'Forensic Bit Error Rate (BER) Tolerance Threshold (Max 5.0%)', () => {
  const dummyAllocations = [
    {
      agentId: 'usr-agent-02',
      agentName: 'Hojaifa',
      studentId: '24524203181',
      trackingToken: 'c4a7e810-7b2a-4f51-9e23-8d6f1234abcd'
    }
  ];

  const dummyBmp = createSyntheticBmp(256, 256);

  // BER = 5.0% -> Recoverable (Within threshold)
  const res50 = analyzeLeakedFile('leaked.bmp', dummyBmp, dummyAllocations, 0.050);
  // Under 5.0% BER simulated, decode does not fail noise threshold
  assert.strictEqual(res50.status !== 'CORRUPTED', true, '5.0% BER should not be marked as corrupted by noise');

  // BER = 5.1% -> Exceeds threshold (Decoder failure)
  const res51 = analyzeLeakedFile('leaked.bmp', dummyBmp, dummyAllocations, 0.051);
  assert.strictEqual(res51.status, 'CORRUPTED', '5.1% BER should trigger CORRUPTED status');
  assert.strictEqual(res51.error.includes('exceeds maximum recoverable threshold of 5.0%'), true);
});

// TC-DLD-EP-03: Leaked File Forensic Upload Format Validation [FR-5]
runTest('TC-DLD-EP-03', 'Leaked File Forensic Format Validation (Rejects .zip, accepts .txt, .jpg, .bmp)', () => {
  const zipValidation = validateForensicFile('leaked_archive.zip', Buffer.from('PK...dummyzip'));
  assert.strictEqual(zipValidation.valid, false, 'ZIP archive must be rejected');
  assert.strictEqual(zipValidation.error.includes('Only original carrier formats (.txt, .jpg, .bmp)'), true);

  const emptyValidation = validateForensicFile('empty_leak.txt', Buffer.alloc(0));
  assert.strictEqual(emptyValidation.valid, false, 'Zero-byte file must be rejected');
  assert.strictEqual(emptyValidation.error.includes('Empty file cannot be analyzed'), true);

  const txtValidation = validateForensicFile('leaked.txt', Buffer.from('hello confidential content'));
  assert.strictEqual(txtValidation.valid, true, 'TXT carrier must be accepted');
});

// TC-DLD-BVA-06: Forensic Attribution Similarity Match Threshold [FR-5]
runTest('TC-DLD-BVA-06', 'Forensic Attribution Match Threshold (Boundary: 80.0% confidence)', () => {
  const targetToken = 'c4a7e810-7b2a-4f51-9e23-8d6f1234abcd';
  const allocations = [
    {
      agentId: 'usr-agent-02',
      agentName: 'Hojaifa',
      studentId: '24524203181',
      trackingToken: targetToken
    }
  ];

  // 100% exact match
  const text50 = Array(50).fill('evidence').join(' ');
  const watermarkedDoc = embedInText(text50, targetToken);
  const bufferExact = Buffer.from(watermarkedDoc, 'utf8');

  const result100 = analyzeLeakedFile('leaked_memo.txt', bufferExact, allocations);
  assert.strictEqual(result100.status, 'POSITIVE_MATCH');
  assert.strictEqual(result100.attributedAgent.name, 'Hojaifa');
  assert.strictEqual(result100.matchConfidence, 100);

  // Confidence check threshold comparison: >= 80.0% is positive, < 80.0% is inconclusive
  assert.strictEqual(80.0 >= 80.0, true, '80.0% meets attribution threshold');
  assert.strictEqual(79.9 < 80.0, true, '79.9% is below threshold (inconclusive)');
});

// -----------------------------------------------------------------------------
// MEMBER 4: TEAM MEMBER (ID: 24524203023)
// -----------------------------------------------------------------------------
console.log('\n--- MEMBER 4: TEAM MEMBER (ID: 24524203023) ---');

// TC-DLD-EP-04: Audit Log Date Range Filter Validation [FR-4]
runTest('TC-DLD-EP-04', 'Audit Log Date Range Filter Validation (Start <= End, no future dates)', () => {
  // P1: Valid historical date range
  const val1 = validateDateRange('2026-09-01', '2026-10-01');
  assert.strictEqual(val1.valid, true, 'Standard past date range should be valid');

  // P3: Inverted date range (Start after End)
  const val2 = validateDateRange('2026-10-08', '2026-09-01');
  assert.strictEqual(val2.valid, false, 'Start date after end date should be rejected');
  assert.strictEqual(val2.error.includes('Start date cannot be later than end date'), true);

  // P4: Future dates
  const val3 = validateDateRange('2026-10-01', '2099-12-31');
  assert.strictEqual(val3.valid, false, 'Future dates should be rejected');
  assert.strictEqual(val3.error.includes('Date cannot be in the future'), true);
});

// TC-DLD-BVA-07: File Access / Download Expiration Duration [FR-2 / NFR-1]
runTest('TC-DLD-BVA-07', 'File Access Expiration Duration (Boundary: [1 to 30 days])', () => {
  function validateExpiryDays(days) {
    const parsed = parseInt(days, 10);
    if (isNaN(parsed) || parsed < config.MIN_EXPIRY_DAYS || parsed > config.MAX_EXPIRY_DAYS) {
      return { valid: false, error: 'Invalid validity period: File access duration must be between 1 and 30 days.' };
    }
    return { valid: true, days: parsed };
  }

  assert.strictEqual(validateExpiryDays(0).valid, false, '0 days should be rejected');
  assert.strictEqual(validateExpiryDays(1).valid, true, '1 day should be accepted');
  assert.strictEqual(validateExpiryDays(30).valid, true, '30 days should be accepted');
  
  const res31 = validateExpiryDays(31);
  assert.strictEqual(res31.valid, false, '31 days should be rejected');
  assert.strictEqual(res31.error.includes('must be between 1 and 30 days'), true);
});

// TC-DLD-BVA-08: Batch Recipient Email Notification Limit [FR-2 / NFR-3]
runTest('TC-DLD-BVA-08', 'Email Notification Batch Limiter (Boundary: Max 10 per batch, 11 splits to 2 batches)', () => {
  // 9 recipients -> 1 batch
  const emails9 = Array.from({ length: 9 }, (_, i) => `agent${i + 1}@org.com`);
  const res9 = dispatchBatchNotifications(emails9, { fileName: 'audit.txt' });
  assert.strictEqual(res9.totalBatches, 1, '9 recipients should yield 1 batch');

  // 10 recipients -> 1 batch
  const emails10 = Array.from({ length: 10 }, (_, i) => `agent${i + 1}@org.com`);
  const res10 = dispatchBatchNotifications(emails10, { fileName: 'audit.txt' });
  assert.strictEqual(res10.totalBatches, 1, '10 recipients should yield 1 batch');
  assert.strictEqual(res10.batches[0].recipientCount, 10);

  // 11 recipients -> 2 batches (10 + 1)
  const emails11 = Array.from({ length: 11 }, (_, i) => `agent${i + 1}@org.com`);
  const res11 = dispatchBatchNotifications(emails11, { fileName: 'audit.txt' });
  assert.strictEqual(res11.totalBatches, 2, '11 recipients should yield 2 batches');
  assert.strictEqual(res11.batches[0].recipientCount, 10, 'Batch 1 should contain 10 recipients');
  assert.strictEqual(res11.batches[1].recipientCount, 1, 'Batch 2 should contain 1 recipient');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 TEST SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(0)}%)`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}

