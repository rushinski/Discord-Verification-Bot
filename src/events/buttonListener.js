const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Config = require('../models/Config');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { customId, user, guild, channel } = interaction;
    const ticket = await Ticket.findOne({ ticketId: channel.id });
    if (!ticket) {
      return interaction.reply({ content: 'This ticket is no longer valid.', ephemeral: true });
    }

    const config = await Config.findOne({ guildId: guild.id });
    if (!config || !config.validMemberLogId) {
      return interaction.reply({ content: 'Configuration error: validMemberLogId is not set.', ephemeral: true });
    }

    if (customId === 'verify') {
      await processValidation(interaction, guild, channel, user, config, 'Manual Verification');
    }

    if (customId === 'decline') {
      const modal = new ModalBuilder()
        .setCustomId('submit_rejection')
        .setTitle('Enter Rejection Reason');

      const input = new TextInputBuilder()
        .setCustomId('rejection_reason')
        .setLabel('Rejection Reason')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(input);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    }
  },
};

// Function to process validation
async function processValidation(interaction, guild, channel, validator, config, rokId = null) {
  await interaction.deferReply({ ephemeral: true });

  const member = await guild.members.fetch(interaction.user.id);
  const joinedAt = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'N/A';
  const createdAt = `<t:${Math.floor(interaction.user.createdAt.getTime() / 1000)}:R>`;

  const logChannel = guild.channels.cache.get(config.validMemberLogId);
  if (!logChannel) {
    return interaction.followUp({ content: 'Logging channel not found.', ephemeral: true });
  }

  // Fetch the original ticket embed to get the RoK profile image
  let rokProfileImage = null;
  const messages = await channel.messages.fetch({ limit: 5 }); // Adjust limit to check previous messages
  for (const message of messages.values()) {
    if (message.embeds.length > 0) {
      // Find the first embed that contains an image (RoK profile image)
      const embed = message.embeds[0];
      if (embed.image) {
        rokProfileImage = embed.image.url; // Extract the image URL from the embed
        break;
      }
    }
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setColor('Green')
    .setTitle('✅ User Verified ✅')
    .setThumbnail(interaction.user.avatarURL())  // User's avatar
    .setImage(rokProfileImage || '')  // Add RoK profile image if found
    .addFields(
      { name: 'Discord Username', value: interaction.user.tag, inline: true },
      { name: 'Discord User Ping', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Discord User ID', value: interaction.user.id, inline: true },
      { name: 'Alliance', value: 'N/A', inline: true },
      { name: 'Time in Server', value: joinedAt, inline: true },
      { name: 'Discord Account Age', value: createdAt, inline: true },
      { name: 'Verification Type', value: 'Manual Verification', inline: true },
      { name: 'Validator', value: validator.tag, inline: true },
      { name: 'Ticket Name', value: channel.name, inline: true },
    );

  await logChannel.send({
    content: `**Verified User:** ${interaction.user.tag}`, // Username above embed
    embeds: [embed],
  });

  await interaction.followUp({ content: 'Ticket has been closed and logged.', ephemeral: true });

  // If RoK ID was provided, save it to the database
  if (rokId) {
    await User.create({ discordUserId: interaction.user.id, rokid: rokId });
  }

  // Remove the ticket from the database before closing the channel
  await Ticket.findOneAndDelete({ ticketId: channel.id });

  // Close ticket
  await channel.delete();
}
