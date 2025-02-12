const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Config = require('../models/Config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-system')
    .setDescription('Configure the bot system settings.')
    .addStringOption(option =>
      option.setName('verifier-role-id')
        .setDescription('The role ID for ticket moderators.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ticket-creation-category-id')
        .setDescription('The category ID for ticket channels.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('verification-channel-id')
        .setDescription('The channel ID for verification.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('kingdom-member-role-id')
        .setDescription('The role ID for Kingdom Members.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('valid-member-log-id')
        .setDescription('Channel or forum post ID for valid member logs.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('invalid-member-log-id')
        .setDescription('Channel or forum post ID for invalid member logs.')
        .setRequired(false)
    ),
    
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    // Get the values from the command input
    const roleId = interaction.options.getString('verifier-role-id');
    const categoryId = interaction.options.getString('ticket-creation-category-id');
    const verificationChannelId = interaction.options.getString('verification-channel-id');
    const kingdomMemberRoleId = interaction.options.getString('kingdom-member-role-id');
    const validMemberLogId = interaction.options.getString('valid-member-log-id');
    const invalidMemberLogId = interaction.options.getString('invalid-member-log-id');

    const updates = {};
    if (roleId) updates.roleId = roleId;
    if (categoryId) updates.ticketCategoryId = categoryId;
    if (verificationChannelId) updates.verificationChannelId = verificationChannelId;
    if (kingdomMemberRoleId) updates.kingdomMemberRoleId = kingdomMemberRoleId;
    if (validMemberLogId) updates.validMemberLogId = validMemberLogId;
    if (invalidMemberLogId) updates.invalidMemberLogId = invalidMemberLogId;

    let config = await Config.findOne({ guildId: interaction.guild.id });

    if (!config) {
      config = new Config({ guildId: interaction.guild.id });
    }

    Object.assign(config, updates);
    await config.save();

    return interaction.reply({
      content: `✅ **Configuration Updated:**\n`
        + `\n🔹 **Role ID:** ${config.roleId || 'Not Set'}`
        + `\n🔹 **Category ID:** ${config.ticketCategoryId || 'Not Set'}`
        + `\n🔹 **Verification Channel ID:** ${config.verificationChannelId || 'Not Set'}`
        + `\n🔹 **Kingdom Member Role ID:** ${config.kingdomMemberRoleId || 'Not Set'}`
        + `\n🔹 **Valid Member Log ID:** ${config.validMemberLogId || 'Not Set'}`
        + `\n🔹 **Invalid Member Log ID:** ${config.invalidMemberLogId || 'Not Set'}`,
      ephemeral: true,
    });
  },
};
