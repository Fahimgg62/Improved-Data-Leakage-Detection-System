const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');

const DB_FILE = path.join(config.DATA_DIR, 'database.json');

// Ensure storage directories exist
[config.DATA_DIR, config.UPLOAD_DIR, config.WATERMARKED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let dbData = {
  users: [],
  files: [],
  allocations: [],
  auditLogs: [],
  investigations: []
};

// Load or initialize DB
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      dbData = JSON.parse(content);
    } catch (err) {
      console.error('Error reading database file, reinitializing:', err.message);
      seedInitialData();
    }
  } else {
    seedInitialData();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error persisting database:', err.message);
  }
}

function seedInitialData() {
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
  
  const users = [
    {
      id: 'usr-admin-01',
      studentId: '24524203055',
      name: 'Fahim Bin Zaman',
      email: 'admin@leaktrace.internal',
      password: defaultPasswordHash,
      role: 'admin',
      department: 'Cyber Forensics & SOC Operations',
      clearanceLevel: 'TOP-SECRET',
      mfaEnabled: true,
      mfaSecret: 'LEAKTRACE-SECURE-KEY-3055',
      createdAt: '2026-10-01T08:00:00.000Z',
      active: true
    },
    {
      id: 'usr-agent-01',
      studentId: '24524203133',
      name: 'Abid Ajmal Tahmid',
      email: 'abid@leaktrace.internal',
      password: defaultPasswordHash,
      role: 'agent',
      department: 'Threat Intelligence Unit',
      clearanceLevel: 'SECRET',
      mfaEnabled: false,
      createdAt: '2026-10-01T09:00:00.000Z',
      active: true
    },
    {
      id: 'usr-agent-02',
      studentId: '24524203181',
      name: 'Hojaifa',
      email: 'hojaifa@leaktrace.internal',
      password: defaultPasswordHash,
      role: 'agent',
      department: 'Cryptographic Security Analysis',
      clearanceLevel: 'SECRET',
      mfaEnabled: false,
      createdAt: '2026-10-01T09:30:00.000Z',
      active: true
    },
    {
      id: 'usr-agent-03',
      studentId: '24524203023',
      name: 'Team Member',
      email: 'member@leaktrace.internal',
      password: defaultPasswordHash,
      role: 'agent',
      department: 'Incident Response & Telemetry',
      clearanceLevel: 'CONFIDENTIAL',
      mfaEnabled: false,
      createdAt: '2026-10-01T10:00:00.000Z',
      active: true
    }
  ];

  // Seed 22 additional agents for concurrent allocation testing (total 25 agents)
  for (let i = 4; i <= 25; i++) {
    const idPad = String(i).padStart(2, '0');
    users.push({
      id: `usr-agent-${idPad}`,
      studentId: `245242030${idPad}`,
      name: `Agent Enclave ${idPad}`,
      email: `agent${i}@leaktrace.internal`,
      password: defaultPasswordHash,
      role: 'agent',
      department: i % 2 === 0 ? 'Field Intelligence' : 'Data Integrity Enclave',
      clearanceLevel: 'CONFIDENTIAL',
      mfaEnabled: false,
      createdAt: '2026-10-02T10:00:00.000Z',
      active: true
    });
  }

  const initialAuditLogs = [
    {
      id: 'aud-seed-01',
      timestamp: '2026-10-01T08:00:00.000Z',
      actionType: 'SYSTEM_BOOT',
      actorId: 'usr-admin-01',
      actorName: 'Fahim Bin Zaman',
      actorRole: 'admin',
      details: 'LeakTrace Forensic Core initialized with FIPS-140-3 telemetry compliance',
      ipAddress: '10.240.1.1'
    },
    {
      id: 'aud-seed-02',
      timestamp: '2026-10-02T11:20:00.000Z',
      actionType: 'ENCLAVE_REGISTERED',
      actorId: 'usr-admin-01',
      actorName: 'Fahim Bin Zaman',
      actorRole: 'admin',
      details: 'Registered 25 security agent accounts in database ledger',
      ipAddress: '10.240.1.1'
    }
  ];

  dbData = {
    users,
    files: [],
    allocations: [],
    auditLogs: initialAuditLogs,
    investigations: []
  };

  saveDB();
}

// Initialize on module import
loadDB();

module.exports = {
  // Collections
  get users() { return dbData.users; },
  get files() { return dbData.files; },
  get allocations() { return dbData.allocations; },
  get auditLogs() { return dbData.auditLogs; },
  get investigations() { return dbData.investigations; },

  // Helpers
  save: saveDB,
  reload: loadDB,

  // Audit Logger [FR-4]
  logAudit(actionType, actor, details, ipAddress = '127.0.0.1') {
    const logEntry = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toISOString(),
      actionType,
      actorId: actor?.id || 'system',
      actorName: actor?.name || 'System Engine',
      actorRole: actor?.role || 'SYSTEM',
      details,
      ipAddress
    };
    dbData.auditLogs.unshift(logEntry);
    saveDB();
    return logEntry;
  }
};

