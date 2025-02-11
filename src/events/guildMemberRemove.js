const { Events } = require('discord.js');
const User = require('../models/User'); // Adjust path if needed

module.exports = {
  name: Events.GuildMemberRemove, // Correctly use the event name
  once: false, // This event should trigger multiple times
  async execute(member) {
    try {
      // Find and remove the user from the database using their Discord user ID
      const user = await User.findOneAndDelete({ discordUserId: member.id });

      if (user) {
        console.log(`User with Discord ID ${member.id} removed from the database.`);
      } else {
        console.log(`No user found in the database with Discord ID ${member.id}.`);
      }
    } catch (error) {
      console.error('Error removing user from database:', error);
    }
  },
};
