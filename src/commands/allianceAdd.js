const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Config = require('../models/Config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alliance-add')
    .setDescription('Add an alliance keyword to the whitelist with an optional role ID.')
    .addStringOption(option =>
      option
        .setName('keyword')
        .setDescription('The keyword for the alliance.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('roleid')
        .setDescription('The role ID to associate with this keyword.')
        .setRequired(false)
    ),
  async execute(interaction) {
    // Check for administrator permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const keyword = interaction.options.getString('keyword').toLowerCase(); // Normalize keyword
    const roleId = interaction.options.getString('roleid');

    // Fetch the guild configuration
    let config = await Config.findOne({ guildId: interaction.guild.id });

    // Create a new config document if none exists
    if (!config) {
      config = new Config({ guildId: interaction.guild.id });
    }

    // Ensure allianceWhitelist is initialized
    if (!config.allianceWhitelist) {
      config.allianceWhitelist = [];
    }

    // Ensure keywordRoles map is initialized
    if (!config.keywordRoles) {
      config.keywordRoles = new Map();
    }

    // Check if the keyword already exists in the whitelist
    if (config.allianceWhitelist.includes(keyword)) {
      return interaction.reply({
        content: `The keyword "${keyword}" is already in the whitelist.`,
        ephemeral: true,
      });
    }

    // Add the keyword to the whitelist
    config.allianceWhitelist.push(keyword);

    // If a role ID is provided, associate it with the keyword
    if (roleId) {
      config.keywordRoles.set(keyword, roleId);
    }

    // Save the updated configuration
    await config.save();

    return interaction.reply({
      content: `Alliance keyword "${keyword}" has been added${roleId ? ` with role ID "${roleId}"` : ''}.`,
      ephemeral: true,
    });
  },
};
