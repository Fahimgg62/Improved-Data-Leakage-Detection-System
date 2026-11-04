const bcrypt = require('bcryptjs');
const db = require('../db');

exports.listAgents = (req, res) => {
  const agents = db.users
    .filter(u => u.role === 'agent')
    .map(a => {
      const allocations = db.allocations.filter(al => al.agentId === a.id);
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        studentId: a.studentId,
        department: a.department,
        clearanceLevel: a.clearanceLevel,
        active: a.active,
        createdAt: a.createdAt,
        allocatedFilesCount: allocations.length
      };
    });

  return res.json({ agents });
};

exports.createAgent = (req, res) => {
  const { name, email, studentId, department, clearanceLevel, password } = req.body;

  if (!name || !email || !studentId) {
    return res.status(400).json({ error: 'Name, email, and Student ID are required.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const newAgent = {
    id: 'usr-agent-' + Date.now().toString(36),
    studentId,
    name,
    email,
    password: bcrypt.hashSync(password || 'Password123!', 10),
    role: 'agent',
    department: department || 'General Enclave',
    clearanceLevel: clearanceLevel || 'CONFIDENTIAL',
    mfaEnabled: false,
    createdAt: new Date().toISOString(),
    active: true
  };

  db.users.push(newAgent);
  db.save();

  db.logAudit('AGENT_CREATED', req.user, `Created new security agent account: ${name} (${email})`, req.ip);

  return res.status(201).json({
    message: 'Agent created successfully',
    agent: {
      id: newAgent.id,
      name: newAgent.name,
      email: newAgent.email,
      studentId: newAgent.studentId,
      department: newAgent.department,
      clearanceLevel: newAgent.clearanceLevel
    }
  });
};

exports.toggleAgentStatus = (req, res) => {
  const { id } = req.params;
  const agent = db.users.find(u => u.id === id && u.role === 'agent');

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found.' });
  }

  agent.active = !agent.active;
  db.save();

  db.logAudit(
    'AGENT_STATUS_TOGGLE',
    req.user,
    `Toggled agent status for ${agent.name} to ${agent.active ? 'ACTIVE' : 'DEACTIVATED'}`,
    req.ip
  );

  return res.json({
    message: `Agent status updated to ${agent.active ? 'ACTIVE' : 'DEACTIVATED'}`,
    agent
  });
};

