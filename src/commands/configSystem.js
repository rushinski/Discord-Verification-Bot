const { SlashCommandBuilder } = require('discord.js');
const Config = require('../models/Config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-system')
    .setDescription('Configure the ticket system settings.')
    .addStringOption(option =>
      option
        .setName('roleid')
        .setDescription('The role ID for ticket moderators.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('categoryid')
        .setDescription('The category ID for ticket channels.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('verification-channel-id')
        .setDescription('The channel ID for the verification channel.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('alliance-add')
        .setDescription('Add an alliance to the whitelist.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('alliance-remove')
        .setDescription('Remove an alliance from the whitelist.')
        .setRequired(false)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const roleId = interaction.options.getString('roleid');
    const categoryId = interaction.options.getString('categoryid');
    const verificationChannelId = interaction.options.getString('verification-channel-id');
    const allianceAdd = interaction.options.getString('alliance-add');
    const allianceRemove = interaction.options.getString('alliance-remove');

    const updates = {};
    if (roleId) updates.roleId = roleId;
    if (categoryId) updates.ticketCategoryId = categoryId;
    if (verificationChannelId) updates.verificationChannelId = verificationChannelId;

    // Fetch the current configuration for the guild
    let config = await Config.findOne({ guildId: interaction.guild.id });

    if (!config) {
      config = new Config({ guildId: interaction.guild.id });
    }

    // Handle adding an alliance to the whitelist
    if (allianceAdd) {
      if (!config.allianceWhitelist) {
        config.allianceWhitelist = [];
      }

      if (config.allianceWhitelist.includes(allianceAdd)) {
        return interaction.reply({
          content: `The alliance "${allianceAdd}" is already in the whitelist.`,
          ephemeral: true,
        });
      }

      config.allianceWhitelist.push(allianceAdd);
      await config.save();

      return interaction.reply({
        content: `Alliance "${allianceAdd}" has been added to the whitelist.`,
        ephemeral: true,
      });
    }

    // Handle removing an alliance from the whitelist
    if (allianceRemove) {
      if (!config.allianceWhitelist || !config.allianceWhitelist.includes(allianceRemove)) {
        return interaction.reply({
          content: `The alliance "${allianceRemove}" is not in the whitelist.`,
          ephemeral: true,
        });
      }

      config.allianceWhitelist = config.allianceWhitelist.filter(alliance => alliance !== allianceRemove);
      await config.save();

      return interaction.reply({
        content: `Alliance "${allianceRemove}" has been removed from the whitelist.`,
        ephemeral: true,
      });
    }

    // Update other settings if provided
    Object.assign(config, updates);
    await config.save();

    await interaction.reply({
      content: `Configuration updated:\nRole ID: ${config.roleId || 'Not Set'}\nCategory ID: ${config.ticketCategoryId || 'Not Set'}\nVerification Channel ID: ${config.verificationChannelId || 'Not Set'}`,
      ephemeral: true,
    });
  },
};
