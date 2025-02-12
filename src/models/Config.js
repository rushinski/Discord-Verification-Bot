const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true }, // Guild ID
  roleId: { type: String }, // Role ID for tickets or moderation
  ticketCategoryId: { type: String }, // Ticket category channel ID
  verificationChannelId: { type: String }, // Verification channel ID
  kingdomMemberRoleId: { type: String }, // Kingdom Member role ID (new field)
  validMemberLogId: { type: String }, 
  invalidMemberLogId: { type: String },
});

module.exports = mongoose.model('Config', configSchema);
