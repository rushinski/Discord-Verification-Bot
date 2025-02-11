const { SlashCommandBuilder } = require('discord.js');
const Config = require('../models/Config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-system')
    .setDescription('Configure the ticket system settings.')
    .addStringOption(option =>
      option.setName('roleid').setDescription('The role ID for ticket moderators.').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('categoryid').setDescription('The category ID for ticket channels.').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('verification-channel-id').setDescription('The channel ID for verification.').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('kingdom-role-id').setDescription('The Kingdom Member Role ID.').setRequired(false)
    ),
  
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const roleId = interaction.options.getString('roleid');
    const categoryId = interaction.options.getString('categoryid');
    const verificationChannelId = interaction.options.getString('verification-channel-id');
    const kingdomRoleId = interaction.options.getString('kingdom-role-id');

    const updates = {};
    if (roleId) updates.roleId = roleId;
    if (categoryId) updates.ticketCategoryId = categoryId;
    if (verificationChannelId) updates.verificationChannelId = verificationChannelId;
    if (kingdomRoleId) updates.kingdomRoleId = kingdomRoleId; // New Kingdom Member Role

    let config = await Config.findOne({ guildId: interaction.guild.id });

    if (!config) {
      config = new Config({ guildId: interaction.guild.id });
    }

    Object.assign(config, updates);
    await config.save();

    return interaction.reply({
      content: `Configuration updated:\nRole ID: ${config.roleId || 'Not Set'}\nCategory ID: ${config.ticketCategoryId || 'Not Set'}\nVerification Channel ID: ${config.verificationChannelId || 'Not Set'}\nKingdom Role ID: ${config.kingdomRoleId || 'Not Set'}`,
      ephemeral: true,
    });
  },
};
