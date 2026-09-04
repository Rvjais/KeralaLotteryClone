const mongoose = require('mongoose');

const WinnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Winner name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  ticket: {
    type: String,
    required: [true, 'Ticket number is required'],
    trim: true,
    uppercase: true,
    index: true
  },
  pos: {
    type: Number,
    required: [true, 'Prize position is required'],
    min: 1,
    max: 6,
    default: 3
  },
  prize: {
    type: Number,
    required: [true, 'Prize amount is required'],
    default: 7500000
  },
  date: {
    type: String,
    required: [true, 'Draw date is required'],
    default: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Winner || mongoose.model('Winner', WinnerSchema);
