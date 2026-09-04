const connectToDatabase = require('../lib/mongodb');
const Winner = require('../models/Winner');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await connectToDatabase();

  try {
    if (db) {
      if (req.method === 'GET') {
        const winners = await Winner.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: winners.length, data: winners });
      }

      if (req.method === 'POST') {
        const { name, phone, ticket, pos, prize, date } = req.body || {};
        if (!name || !phone || !ticket) {
          return res.status(400).json({ success: false, message: 'Name, phone, and ticket number are required.' });
        }
        const created = await Winner.create({
          name: name.trim(),
          phone: phone.trim(),
          ticket: ticket.trim().toUpperCase(),
          pos: parseInt(pos) || 3,
          prize: parseFloat(prize) || 0,
          date: date || new Date().toISOString().split('T')[0]
        });
        return res.status(201).json({ success: true, message: 'Winner created successfully in MongoDB.', data: created });
      }

      if (req.method === 'PUT') {
        const { _id, ticket, name, phone, pos, prize, date } = req.body || {};
        let updated;
        if (_id) {
          updated = await Winner.findByIdAndUpdate(_id, { name, phone, ticket, pos, prize, date }, { new: true });
        } else if (ticket) {
          updated = await Winner.findOneAndUpdate({ ticket: ticket.toUpperCase() }, { name, phone, pos, prize, date }, { new: true });
        }
        return res.status(200).json({ success: true, message: 'Winner updated successfully in MongoDB.', data: updated });
      }

      if (req.method === 'DELETE') {
        const { _id, ticket } = req.query || req.body || {};
        if (_id) {
          await Winner.findByIdAndDelete(_id);
        } else if (ticket) {
          await Winner.findOneAndDelete({ ticket: ticket.toUpperCase() });
        }
        return res.status(200).json({ success: true, message: 'Winner deleted successfully from MongoDB.' });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: 'Could not connect to MongoDB database.'
      });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[Winners API Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Database error' });
  }
};
