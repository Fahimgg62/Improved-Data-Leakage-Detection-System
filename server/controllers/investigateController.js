const fs = require('fs');
const db = require('../db');
const { analyzeLeakedFile } = require('../stego/forensicEngine');

/**
 * Investigates a suspected leaked document and performs steganographic extraction & attribution.
 * [FR-5 / TC-DLD-EP-03, TC-DLD-BVA-05, TC-DLD-BVA-06]
 */
exports.analyzeLeak = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No leaked file submitted for forensic analysis.' });
  }

  const fileBuffer = fs.readFileSync(req.file.path);
  const originalFilename = req.file.originalname;

  // Check simulated BER from request body if testing noise conditions
  const simulatedBER = req.body.simulatedBER ? parseFloat(req.body.simulatedBER) : null;

  const result = analyzeLeakedFile(originalFilename, fileBuffer, db.allocations, simulatedBER);

  // Clean up temporary upload file
  try {
    fs.unlinkSync(req.file.path);
  } catch (err) {
    // Ignore cleanup errors
  }

  // Record investigation in database
  const investigationRecord = {
    id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    timestamp: new Date().toISOString(),
    filename: originalFilename,
    fileSize: req.file.size,
    status: result.status,
    success: result.success,
    extractedToken: result.extractedToken || null,
    matchConfidence: result.matchConfidence || null,
    attributedAgent: result.attributedAgent || null,
    details: result.message || result.error
  };

  db.investigations.unshift(investigationRecord);
  db.save();

  db.logAudit(
    'LEAK_INVESTIGATION',
    req.user,
    `Investigated suspected leaked file ${originalFilename}: Result=${result.status} [${result.message || result.error}]`,
    req.ip
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

/**
 * Lists past investigation records.
 */
exports.getInvestigationHistory = (req, res) => {
  return res.json({ investigations: db.investigations });
};

