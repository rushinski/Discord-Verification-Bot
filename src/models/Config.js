const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roleId: { type: String },
  ticketCategoryId: { type: String },
  verificationChannelId: { type: String },
  allianceWhitelist: { type: [String], default: [] },
});

module.exports = mongoose.model('Config', configSchema);
