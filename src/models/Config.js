const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true }, // Guild ID
  roleId: { type: String }, // Role ID for tickets or moderation
  ticketCategoryId: { type: String }, // Ticket category channel ID
  verificationChannelId: { type: String }, // Verification channel ID
  kingdomRoleId: { type: String }, // NEW: Kingdom Member Role ID
});

module.exports = mongoose.model('Config', configSchema);
