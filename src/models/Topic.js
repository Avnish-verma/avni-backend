const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  subject:   { type: String, required: true, trim: true },
  topic:     { type: String, required: true, trim: true },
  notes:     { type: String, default: '' },
  priority:  { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },

  // Stored as 'YYYY-MM-DD' strings to avoid timezone drift
  dateAdded: { type: String, required: true },
  day4Date:  { type: String, required: true },
  day7Date:  { type: String, required: true },

  day4Done:  { type: Boolean, default: false },
  day7Done:  { type: Boolean, default: false },

  day4Confidence: { type: String, enum: ['weak', 'okay', 'strong', null], default: null },
  day7Confidence: { type: String, enum: ['weak', 'okay', 'strong', null], default: null },

  day4CompletedAt: { type: Date, default: null },
  day7CompletedAt: { type: Date, default: null },

  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);