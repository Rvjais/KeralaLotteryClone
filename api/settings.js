const connectToDatabase = require('../lib/mongodb');
const Setting = require('../models/Setting');

const DEFAULT_PRIZE_TIERS = {
  1: 250000000, // ₹25 Crores
  2: 100000000, // ₹10 Crores
  3: 7500000,   // ₹75 Lakhs
  4: 2500000,   // ₹25 Lakhs
  5: 1200000,   // ₹12 Lakhs
  6: 100000     // ₹1 Lakh
};

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();

    if (req.method === 'GET') {
      if (db) {
        const doc = await Setting.findOne({ key: 'prize_tiers' });
        if (doc && doc.value) {
          return res.status(200).json({ success: true, data: doc.value });
        }
      }
      return res.status(200).json({ success: true, data: DEFAULT_PRIZE_TIERS });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { prize_tiers, prizes } = req.body || {};
      const newPrizes = prize_tiers || prizes;

      if (!newPrizes || typeof newPrizes !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid prize tier data.' });
      }

      // Sanitize prize tiers mapping
      const sanitized = {};
      for (let i = 1; i <= 6; i++) {
        const val = parseFloat(newPrizes[i] ?? newPrizes[String(i)] ?? DEFAULT_PRIZE_TIERS[i]);
        sanitized[i] = isNaN(val) ? DEFAULT_PRIZE_TIERS[i] : val;
      }

      if (db) {
        await Setting.findOneAndUpdate(
          { key: 'prize_tiers' },
          { key: 'prize_tiers', value: sanitized, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Prize configuration saved successfully to MongoDB Atlas.',
        data: sanitized
      });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[Settings API Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Database error' });
  }
};

