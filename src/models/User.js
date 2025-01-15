const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  rokid: { type: String, required: true, unique: true },
  discordUserId: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
