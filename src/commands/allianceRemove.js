const { SlashCommandBuilder } = require('discord.js');
const Keyword = require('../models/Keyword');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alliance-remove')
    .setDescription('Remove an alliance keyword from the whitelist.')
    .addStringOption(option =>
      option
        .setName('keyword')
        .setDescription('The keyword for the alliance to remove.')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const keyword = interaction.options.getString('keyword');

    // Check if the keyword exists
    const existingKeyword = await Keyword.findOne({ guildId: interaction.guild.id, keyword });

    if (!existingKeyword) {
      return interaction.reply({
        content: `The keyword "${keyword}" does not exist in the whitelist.`,
        ephemeral: true,
      });
    }

    // Remove the keyword from the database
    await Keyword.deleteOne({ guildId: interaction.guild.id, keyword });

    return interaction.reply({
      content: `Alliance keyword "${keyword}" has been removed from the whitelist.`,
      ephemeral: true,
    });
  },
};
