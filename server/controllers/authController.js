const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const db = require('../db');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: user.studentId
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // Check MFA Requirement
  if (user.mfaEnabled) {
    const tempMfaToken = jwt.sign(
      { id: user.id, mfaPending: true },
      config.JWT_SECRET,
      { expiresIn: '10m' }
    );
    return res.json({
      mfaRequired: true,
      mfaToken: tempMfaToken,
      message: 'Multi-factor authentication challenge required'
    });
  }

  const token = generateToken(user);
  db.logAudit('USER_LOGIN', user, `User authenticated successfully via standard login`, req.ip);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      department: user.department,
      clearanceLevel: user.clearanceLevel
    }
  });
};

exports.verifyMfa = (req, res) => {
  const { mfaToken, code } = req.body;

  if (!mfaToken || !code) {
    return res.status(400).json({ error: 'MFA token and verification code are required.' });
  }

  try {
    const decoded = jwt.verify(mfaToken, config.JWT_SECRET);
    if (!decoded.mfaPending) {
      return res.status(400).json({ error: 'Invalid MFA challenge token.' });
    }

    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User associated with challenge was not found.' });
    }

    // Demo MFA accept 123456 or 654321 or matching 6 digits
    if (code !== '123456' && code !== '245242' && code.length !== 6) {
      return res.status(400).json({ error: 'Invalid MFA code. Use demo code 123456.' });
    }

    const token = generateToken(user);
    db.logAudit('MFA_SUCCESS', user, `MFA challenge passed successfully with security token`, req.ip);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        clearanceLevel: user.clearanceLevel
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Expired or invalid MFA token session.' });
  }
};

exports.getProfile = (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      studentId: req.user.studentId,
      department: req.user.department,
      clearanceLevel: req.user.clearanceLevel,
      mfaEnabled: req.user.mfaEnabled
    }
  });
};

