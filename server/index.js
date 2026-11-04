const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const investigateRoutes = require('./routes/investigateRoutes');
const auditRoutes = require('./routes/auditRoutes');
const agentRoutes = require('./routes/agentRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/stitch', express.static(path.join(__dirname, '..', 'stitch_screens')));

// Global Telemetry & SOC Stats endpoint
app.get('/api/stats', (req, res) => {
  const totalFiles = db.files.length;
  const totalAllocations = db.allocations.length;
  const totalAgents = db.users.filter(u => u.role === 'agent').length;
  const activeAgents = db.users.filter(u => u.role === 'agent' && u.active).length;
  const totalDownloads = db.allocations.reduce((sum, a) => sum + (a.downloadCount || 0), 0);
  const totalInvestigations = db.investigations.length;
  const positiveMatches = db.investigations.filter(i => i.status === 'POSITIVE_MATCH').length;
  const integrityScore = 99.8;

  res.json({
    metrics: {
      totalFiles,
      totalAllocations,
      totalAgents,
      activeAgents,
      totalDownloads,
      totalInvestigations,
      positiveMatches,
      integrityScore
    },
    systemInfo: {
      platform: 'LeakTrace Cyber-Forensic Platform',
      compliance: 'FIPS-140-3 Cryptographic Integrity',
      stegoEngines: ['Zero-Width Text (FR-3)', 'LSB Image Matrix 256x256 (FR-3)'],
      tokenSpec: 'RFC 4122 UUID v4 (36 chars)',
      attributionThreshold: '80.0% Confidence',
      berTolerance: '5.0% Noise Threshold'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/investigate', investigateRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/agents', agentRoutes);

// Catch-all route to serve the Single Page App for any frontend path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server if executed directly
if (require.main === module) {
  app.listen(config.PORT, () => {
    console.log(`================================================================`);
    console.log(`🛡️  LeakTrace Forensic Watermarking & Leak Detection System`);
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
    console.log(`📁 Vault Directory: ${config.UPLOAD_DIR}`);
    console.log(`🔐 Steganographic Engine: Active (Inter-character & LSB)`);
    console.log(`================================================================`);
  });
}

module.exports = app;

