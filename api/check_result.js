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
      const allWinners = await Winner.find({}).sort({ pos: 1, date: -1 }).limit(30);
      
      const formattedOther = allWinners.map(w => ({
        name: w.name,
        phone: w.phone ? (w.phone.length >= 10 ? w.phone.substring(0, 2) + 'XXXXXX' + w.phone.substring(8) : w.phone) : '—',
        ticket_number: w.ticket,
        position: w.pos,
        position_label: (['', '1st', '2nd', '3rd', '4th', '5th', '6th'][w.pos] || w.pos + 'th') + ' Prize',
        winning_amount: w.prize,
        draw_date: w.date
      }));

      if (winner) {
        return res.status(200).json({
          success: true,
          isWinner: true,
          winner: {
            name: winner.name,
            phone: winner.phone,
            ticket_number: winner.ticket,
            position: winner.pos,
            position_label: (['', '1st', '2nd', '3rd', '4th', '5th', '6th'][winner.pos] || winner.pos + 'th') + ' Prize',
            winning_amount: winner.prize,
            draw_date: winner.date
          },
          otherWinners: formattedOther
        });
      } else {
        return res.status(200).json({
          success: true,
          isWinner: false,
          message: 'No winning record found for this mobile number in today\'s draw.',
          otherWinners: formattedOther
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: 'Database connection unavailable.'
      });
    }
  } catch (error) {
    console.error('[Check Result API Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Database error.' });
  }
};
