const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Keyword = require('../models/Keyword');

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

    const guildId = interaction.guild.id;
    const keyword = interaction.options.getString('keyword'); // Preserve original case
    const roleId = interaction.options.getString('roleid');

    // Check if the keyword already exists for this guild (case-sensitive)
    const existingKeyword = await Keyword.findOne({ guildId, keyword });

    if (existingKeyword) {
      return interaction.reply({
        content: `The keyword "${keyword}" is already in the whitelist.`,
        ephemeral: true,
      });
    }

    // Create and save the new keyword entry
    const newKeyword = new Keyword({ guildId, keyword, roleId });
    await newKeyword.save();

    return interaction.reply({
      content: `Alliance keyword "${keyword}" has been added${roleId ? ` with role ID "${roleId}"` : ''}.`,
      ephemeral: true,
    });
  },
};
