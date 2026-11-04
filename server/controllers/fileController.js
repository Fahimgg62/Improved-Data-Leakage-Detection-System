const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const db = require('../db');
const { generateTrackingToken } = require('../stego/tokenValidator');
const { embedInText } = require('../stego/textStego');
const { embedInImage } = require('../stego/imageStego');
const { dispatchBatchNotifications } = require('./notificationService');

/**
 * Uploads original confidential document to the vault.
 * [FR-1]
 */
exports.uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileBuffer = fs.readFileSync(req.file.path);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const ext = path.extname(req.file.originalname).toLowerCase();

  const fileDoc = {
    id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    extension: ext,
    mimeType: req.file.mimetype,
    hash: hash,
    uploadedBy: req.user.id,
    uploadedByName: req.user.name,
    uploadTimestamp: new Date().toISOString(),
    distributionCount: 0
  };

  db.files.unshift(fileDoc);
  db.save();

  db.logAudit(
    'FILE_UPLOAD',
    req.user,
    `Uploaded confidential document: ${fileDoc.originalName} (${(fileDoc.size / 1024).toFixed(1)} KB) [SHA256: ${hash.slice(0, 16)}...]`,
    req.ip
  );

  return res.status(201).json({
    message: 'File uploaded and secured successfully',
    file: fileDoc
  });
};

/**
 * Lists all vault files for administrators.
 */
exports.listFiles = (req, res) => {
  const filesWithStats = db.files.map(f => {
    const allocations = db.allocations.filter(a => a.fileId === f.id);
    return {
      ...f,
      allocationsCount: allocations.length,
      downloadCount: allocations.reduce((sum, a) => sum + (a.downloadCount || 0), 0)
    };
  });
  return res.json({ files: filesWithStats });
};

/**
 * Distributes a file to targeted agents with unique steganographic footprints.
 * [FR-2, FR-3, FR-4 / TC-DLD-BVA-02, TC-DLD-BVA-07, TC-DLD-BVA-08]
 */
exports.distributeFile = async (req, res) => {
  const { fileId, agentIds, validityDays = 7 } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: 'fileId is required.' });
  }

  // Find target file
  const file = db.files.find(f => f.id === fileId);
  if (!file) {
    return res.status(404).json({ error: 'Specified file not found in vault.' });
  }

  // Validate agent selection count [FR-2 / TC-DLD-BVA-02]
  if (!Array.isArray(agentIds) || agentIds.length === 0) {
    return res.status(400).json({
      error: 'Select at least 1 agent for distribution.',
      statusCode: 400
    });
  }

  if (agentIds.length > config.MAX_AGENTS_PER_BATCH) {
    return res.status(400).json({
      error: 'Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle.',
      statusCode: 400,
      selectedCount: agentIds.length,
      limit: config.MAX_AGENTS_PER_BATCH
    });
  }

  // Validate access validity duration [FR-2 / NFR-1 / TC-DLD-BVA-07]
  const parsedDays = parseInt(validityDays, 10);
  if (isNaN(parsedDays) || parsedDays < config.MIN_EXPIRY_DAYS || parsedDays > config.MAX_EXPIRY_DAYS) {
    return res.status(400).json({
      error: 'Invalid validity period: File access duration must be between 1 and 30 days.',
      statusCode: 400,
      providedDays: validityDays,
      validRange: `[${config.MIN_EXPIRY_DAYS}, ${config.MAX_EXPIRY_DAYS}]`
    });
  }

  // Find target agents in DB
  const selectedAgents = db.users.filter(u => agentIds.includes(u.id) && u.role === 'agent' && u.active);
  if (selectedAgents.length === 0) {
    return res.status(400).json({ error: 'No active authorized agents found from provided IDs.' });
  }

  // Read original file buffer
  if (!fs.existsSync(file.path)) {
    return res.status(500).json({ error: 'Original file payload is missing from disk storage.' });
  }
  const originalBuffer = fs.readFileSync(file.path);

  const newAllocations = [];
  const errors = [];
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parsedDays);

  for (const agent of selectedAgents) {
    try {
      const trackingToken = generateTrackingToken();
      let watermarkedBuffer;

      if (file.extension === '.txt') {
        const coverText = originalBuffer.toString('utf8');
        const watermarkedText = embedInText(coverText, trackingToken);
        watermarkedBuffer = Buffer.from(watermarkedText, 'utf8');
      } else {
        watermarkedBuffer = embedInImage(originalBuffer, trackingToken);
      }

      // Save watermarked file copy
      const watermarkedFilename = `wm-${agent.id}-${file.filename}`;
      const watermarkedPath = path.join(config.WATERMARKED_DIR, watermarkedFilename);
      fs.writeFileSync(watermarkedPath, watermarkedBuffer);

      const watermarkedHash = crypto.createHash('sha256').update(watermarkedBuffer).digest('hex');

      const allocation = {
        id: 'alloc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        fileId: file.id,
        originalFilename: file.originalName,
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        studentId: agent.studentId,
        department: agent.department,
        trackingToken: trackingToken,
        watermarkedPath: watermarkedPath,
        watermarkedFilename: watermarkedFilename,
        watermarkedHash: watermarkedHash,
        allocatedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        validityDays: parsedDays,
        downloadCount: 0,
        lastDownloadedAt: null
      };

      db.allocations.unshift(allocation);
      newAllocations.push(allocation);

      db.logAudit(
        'AGENT_ALLOCATION',
        req.user,
        `Allocated copy of ${file.originalName} to agent ${agent.name} (${agent.email}) [Token: ${trackingToken}]`,
        req.ip
      );
    } catch (embedError) {
      errors.push({
        agentId: agent.id,
        agentName: agent.name,
        error: embedError.message
      });
    }
  }

  if (newAllocations.length === 0) {
    return res.status(400).json({
      error: 'Failed to generate watermarked copies for any recipient',
      details: errors
    });
  }

  file.distributionCount = (file.distributionCount || 0) + newAllocations.length;
  db.save();

  // Dispatch batch notifications [FR-2 / NFR-3 / TC-DLD-BVA-08]
  const recipientEmails = selectedAgents.map(a => a.email);
  const notificationResult = dispatchBatchNotifications(recipientEmails, {
    fileId: file.id,
    fileName: file.originalName
  });

  return res.status(201).json({
    message: `Successfully allocated file to ${newAllocations.length} agents`,
    allocatedCount: newAllocations.length,
    allocations: newAllocations,
    notifications: notificationResult,
    errors: errors.length > 0 ? errors : undefined
  });
};

/**
 * Gets files allocated to the current agent.
 */
exports.getAgentFiles = (req, res) => {
  const agentId = req.user.id;
  const allocations = db.allocations.filter(a => a.agentId === agentId);

  const fileList = allocations.map(a => {
    const isExpired = new Date() > new Date(a.expiresAt);
    return {
      allocationId: a.id,
      fileId: a.fileId,
      filename: a.originalFilename,
      allocatedAt: a.allocatedAt,
      expiresAt: a.expiresAt,
      isExpired,
      downloadCount: a.downloadCount,
      lastDownloadedAt: a.lastDownloadedAt
    };
  });

  return res.json({ files: fileList });
};

/**
 * Downloads a recipient-specific copy with validity verification.
 */
exports.downloadFile = (req, res) => {
  const { allocationId } = req.params;
  const allocation = db.allocations.find(a => a.id === allocationId);

  if (!allocation) {
    return res.status(404).json({ error: 'Requested file allocation not found.' });
  }

  // Authorization check (admin or recipient agent)
  if (req.user.role !== 'admin' && req.user.id !== allocation.agentId) {
    return res.status(403).json({ error: 'Access forbidden: You are not authorized to download this copy.' });
  }

  // Verify expiration date [FR-2 / NFR-1]
  const now = new Date();
  if (now > new Date(allocation.expiresAt)) {
    db.logAudit(
      'DOWNLOAD_EXPIRED_BLOCK',
      req.user,
      `Blocked expired download attempt for file ${allocation.originalFilename} (expired at ${allocation.expiresAt})`,
      req.ip
    );
    return res.status(403).json({
      error: 'Access expired: This file download validity period has lapsed.',
      expiresAt: allocation.expiresAt
    });
  }

  if (!fs.existsSync(allocation.watermarkedPath)) {
    return res.status(404).json({ error: 'Watermarked copy is missing from file storage.' });
  }

  allocation.downloadCount = (allocation.downloadCount || 0) + 1;
  allocation.lastDownloadedAt = now.toISOString();
  db.save();

  db.logAudit(
    'FILE_DOWNLOAD',
    req.user,
    `Downloaded personalized watermarked copy of ${allocation.originalFilename} [Tracking Token: ${allocation.trackingToken}]`,
    req.ip
  );

  return res.download(allocation.watermarkedPath, allocation.originalFilename);
};

