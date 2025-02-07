const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
  guildId: { type: String, required: true }, // Guild ID
  keyword: { type: String, required: true }, // Alliance tag keyword (case-sensitive)
  roleId: { type: String, required: false }, // Optional Discord role ID for this keyword
});

module.exports = mongoose.model('Keyword', keywordSchema);
