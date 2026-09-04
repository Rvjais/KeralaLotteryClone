const connectToDatabase = require('../lib/mongodb');
const Winner = require('../models/Winner');

const INITIAL_SEED_WINNERS = [
  { name: 'Syedzaffrullah', phone: '9840560904', ticket: 'SK830991', pos: 3, prize: 7500000, date: '2026-09-04' },
  { name: 'Seenivasan', phone: '9629537821', ticket: 'SK097279', pos: 3, prize: 7500000, date: '2026-09-04' },
  { name: 'Rajendrajayakumar. P', phone: '9840488811', ticket: 'KL917845', pos: 3, prize: 7500000, date: '2026-09-04' },
  { name: 'K. Sahaya Arputha Mary', phone: '8778785075', ticket: 'KL574443', pos: 3, prize: 7500000, date: '2026-09-04' },
  { name: 'A.Nithiyanandam', phone: '9092061965', ticket: 'SK146704', pos: 4, prize: 2500000, date: '2026-09-04' },
  { name: 'Ravichandran M', phone: '9994679131', ticket: 'KL263485', pos: 4, prize: 2500000, date: '2026-09-04' },
  { name: 'Pm Kumar', phone: '9345812713', ticket: 'KL680342', pos: 4, prize: 2500000, date: '2026-09-04' },
  { name: 'Kesavan R', phone: '9659185567', ticket: 'KL289517', pos: 4, prize: 2500000, date: '2026-09-04' },
  { name: 'Rajesh Kumar', phone: '9876543210', ticket: 'KL770487', pos: 1, prize: 250000000, date: '2026-04-10' },
  { name: 'Priya Nair', phone: '9988776655', ticket: 'TB251634', pos: 2, prize: 100000000, date: '2026-04-10' }
];

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
    // If DB is connected, use MongoDB; otherwise fallback gracefully
    if (db) {
      if (req.method === 'GET') {
        let winners = await Winner.find({}).sort({ createdAt: -1 });
        if (!winners || winners.length === 0) {
          // Auto-seed initial dataset
          winners = await Winner.insertMany(INITIAL_SEED_WINNERS);
        }
        return res.status(200).json({ success: true, count: winners.length, data: winners });
      }

      if (req.method === 'POST') {
        const { name, phone, ticket, pos, prize, date } = req.body || {};
        if (!name || !phone || !ticket) {
          return res.status(400).json({ success: false, message: 'Name, phone, and ticket number are required.' });
        }
        const created = await Winner.create({
          name,
          phone,
          ticket: ticket.toUpperCase(),
          pos: parseInt(pos) || 3,
          prize: parseFloat(prize) || 7500000,
          date: date || new Date().toISOString().split('T')[0]
        });
        return res.status(201).json({ success: true, message: 'Winner created successfully.', data: created });
      }

      if (req.method === 'PUT') {
        const { _id, ticket, name, phone, pos, prize, date } = req.body || {};
        let updated;
        if (_id) {
          updated = await Winner.findByIdAndUpdate(_id, { name, phone, ticket, pos, prize, date }, { new: true });
        } else if (ticket) {
          updated = await Winner.findOneAndUpdate({ ticket: ticket.toUpperCase() }, { name, phone, pos, prize, date }, { new: true });
        }
        return res.status(200).json({ success: true, message: 'Winner updated successfully.', data: updated });
      }

      if (req.method === 'DELETE') {
        const { _id, ticket } = req.query || req.body || {};
        if (_id) {
          await Winner.findByIdAndDelete(_id);
        } else if (ticket) {
          await Winner.findOneAndDelete({ ticket: ticket.toUpperCase() });
        }
        return res.status(200).json({ success: true, message: 'Winner deleted successfully.' });
      }
    } else {
      // In-Memory / Local Storage Fallback if Mongo URI not connected
      return res.status(200).json({
        success: true,
        source: 'fallback',
        message: 'Operating with client local state / initial seed.',
        data: INITIAL_SEED_WINNERS
      });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[Winners API Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Database error' });
  }
};

