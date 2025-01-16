const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  roleId: { type: String, required: false },
  ticketCategoryId: { type: String, required: false },
});

module.exports = mongoose.model('Config', configSchema);
