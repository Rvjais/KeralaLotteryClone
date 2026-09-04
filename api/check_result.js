const connectToDatabase = require('../lib/mongodb');
const Winner = require('../models/Winner');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { phone } = req.query || {};

  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required.' });
  }

  const cleanPhone = phone.trim();

  try {
    const db = await connectToDatabase();

    if (db) {
      const winner = await Winner.findOne({ phone: cleanPhone });
      if (winner) {
        return res.status(200).json({
          success: true,
          isWinner: true,
          winner: {
            name: winner.name,
            phone: winner.phone,
            ticket_number: winner.ticket,
            position: winner.pos,
            position_label: winner.pos + 'th Prize',
            winning_amount: winner.prize,
            draw_date: winner.date
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          isWinner: false,
          message: 'No winning record found for this number in today\'s draw.'
        });
      }
    } else {
      // In-memory fallback
      return res.status(200).json({
        success: false,
        source: 'fallback',
        message: 'Database offline, please use client fallback.'
      });
    }
  } catch (error) {
    console.error('[Check Result API Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Database error.' });
  }
};

