const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true }, // Guild ID
  roleId: { type: String }, // Role ID for tickets or moderation
  ticketCategoryId: { type: String }, // Ticket category channel ID
  verificationChannelId: { type: String }, // Verification channel ID
  
  // Map of keywords to their associated role IDs (if applicable)
  keywordRoles: {
    type: Map,
    of: String, // Maps a keyword to a role ID
    default: {}, // Default is an empty map
  },

  // Role ID for verified members (optional)
  verifiedRoleId: {
    type: String,
  },

  // Whitelist of alliances (array of strings)
  allianceWhitelist: {
    type: [String], // Array of strings
    default: [], // Default is an empty array
  },
});

module.exports = mongoose.model('Config', configSchema);
