const { SlashCommandBuilder } = require('discord.js');
const Config = require('../models/Config');

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

    // Fetch the guild configuration
    let config = await Config.findOne({ guildId: interaction.guild.id });

    if (!config) {
      return interaction.reply({
        content: 'Configuration not found for this guild. Please set it up first.',
        ephemeral: true,
      });
    }

    // Ensure allianceWhitelist is initialized as an array
    if (!config.allianceWhitelist) {
      config.allianceWhitelist = [];
    }

    // Check if the keyword exists in the whitelist
    if (!config.allianceWhitelist.includes(keyword)) {
      return interaction.reply({
        content: `The keyword "${keyword}" does not exist in the whitelist.`,
        ephemeral: true,
      });
    }

    // Remove the keyword from the whitelist
    config.allianceWhitelist = config.allianceWhitelist.filter(item => item !== keyword);
    await config.save();

    return interaction.reply({
      content: `Alliance keyword "${keyword}" has been removed from the whitelist.`,
      ephemeral: true,
    });
  },
};
