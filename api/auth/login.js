require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { username, password } = req.body || {};

    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const envPass = process.env.ADMIN_PASSWORD || 'admin123';
    const jwtSecret = process.env.JWT_SECRET || 'kerala_lottery_super_secret_jwt_key_2026';

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    if (username.trim() === envUser.trim() && password.trim() === envPass.trim()) {
      const token = jwt.sign(
        { user: username, role: 'admin', iat: Math.floor(Date.now() / 1000) },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: { username, role: 'Directorate Administrator' }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }
  } catch (error) {
    console.error('[Auth API Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};
