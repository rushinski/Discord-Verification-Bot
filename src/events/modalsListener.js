const { EmbedBuilder } = require('discord.js');
const Ticket = require('../models/Ticket');
const Config = require('../models/Config');
const User = require('../models/User');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;

    const { customId, user, guild, channel } = interaction;
    const ticket = await Ticket.findOne({ ticketId: channel.id });
    if (!ticket) {
      return interaction.reply({ content: 'This ticket is no longer valid.', ephemeral: true });
    }

    if (customId === 'submit_rokid') {
      const rokId = interaction.fields.getTextInputValue('rokid_input');
      await processValidation(interaction, guild, channel, user, 'Manual Verification', rokId);
    }

    if (customId === 'submit_rejection') {
      const reason = interaction.fields.getTextInputValue('rejection_reason');
      await processRejection(interaction, guild, channel, user, reason);
    }
  },
};

async function processRejection(interaction, guild, channel, validator, reason) {
  await interaction.deferReply({ ephemeral: true });

  const config = await Config.findOne({ guildId: guild.id });
  if (!config || !config.invalidMemberLogId) {
    return interaction.followUp({ content: 'Logging channel not found.', ephemeral: true });
  }

  const logChannel = guild.channels.cache.get(config.invalidMemberLogId);
  if (!logChannel) {
    return interaction.followUp({ content: 'Logging channel not found.', ephemeral: true });
  }

  const member = await guild.members.fetch(interaction.user.id);
  const joinedAt = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'N/A';
  const accountCreatedAt = `<t:${Math.floor(interaction.user.createdAt.getTime() / 1000)}:R>`;

  let rokProfileImage = null;
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const embedMessage = messages.find(msg => msg.embeds.length > 0);
    if (embedMessage) {
      const embed = embedMessage.embeds[0];
      if (embed.image) {
        rokProfileImage = embed.image.url;
      }
    }
  } catch (error) {
    console.error("Error fetching RoK profile image from embed:", error);
  }

  const embed = new EmbedBuilder()
    .setColor('Red')
    .setTitle('❌ User Verification Rejected ❌')
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: 'Discord Username', value: interaction.user.tag, inline: true },
      { name: 'Discord User Ping', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Discord User ID', value: interaction.user.id, inline: true },
      { name: 'Time in Server', value: joinedAt, inline: true },
      { name: 'Account Age', value: accountCreatedAt, inline: true },
      { name: 'Verification Type', value: 'Rejected Verification', inline: true },
      { name: 'Reason for Rejection', value: reason, inline: false },
      { name: 'Validator', value: validator.tag, inline: true },
      { name: 'Ticket Name', value: channel.name, inline: true }
    );

  if (rokProfileImage) {
    embed.setImage(rokProfileImage);
  }

  await logChannel.send({
    content: `**Rejected User:** ${interaction.user.tag}`,
    embeds: [embed],
  });

  // Check if the user exists in the User model and delete if found
  const existingUser = await User.findOne({ discordUserId: interaction.user.id });
  if (existingUser) {
    await User.deleteOne({ discordUserId: interaction.user.id });
    console.log(`Deleted user entry for Discord ID: ${interaction.user.id}`);
  }

  // Send confirmation message before deleting the channel
  await interaction.followUp({ content: 'Ticket has been closed and logged.', ephemeral: true });

  // Remove ticket from MongoDB
  await Ticket.deleteOne({ ticketId: channel.id });

  // Close ticket
  await channel.delete();
}
