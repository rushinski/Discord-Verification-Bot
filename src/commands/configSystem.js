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
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const roleId = interaction.options.getString('roleid');
    const categoryId = interaction.options.getString('categoryid');

    const updates = {};
    if (roleId) updates.roleId = roleId;
    if (categoryId) updates.ticketCategoryId = categoryId;

    const config = await Config.findOneAndUpdate(
      { guildId: interaction.guild.id },
      updates,
      { new: true, upsert: true }
    );

    await interaction.reply({
      content: `Configuration updated:\nRole ID: ${config.roleId || 'Not Set'}\nCategory ID: ${config.ticketCategoryId || 'Not Set'}`,
      ephemeral: true,
    });
  },
};
