const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Keyword = require('../models/Keyword');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show-alliance-whitelist')
    .setDescription('Displays all whitelisted alliance keywords and their assigned roles.'),
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    // Fetch all keywords for the guild
    const keywords = await Keyword.find({ guildId: interaction.guild.id });

    if (!keywords.length) {
      return interaction.reply({ content: 'No alliance keywords are currently whitelisted.', ephemeral: true });
    }

    // Create an embed to display the data
    const embed = new EmbedBuilder()
      .setTitle('Alliance Whitelist')
      .setColor('#0099ff')
      .setDescription('Here are the currently whitelisted alliances and their assigned roles.');

    keywords.forEach(keyword => {
      const roleMention = keyword.roleId ? `<@&${keyword.roleId}>` : 'None';
      embed.addFields({ name: keyword.keyword, value: `Role: ${roleMention}`, inline: true });
    });

    return interaction.reply({ embeds: [embed] });
  },
};
