const { EmbedBuilder, AttachmentBuilder, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Counter = require('../models/Counter');
const Config = require('../models/Config');
const Ticket = require('../models/Ticket');

async function createTicket({ guild, user, imageBuffer, failures }) {
  console.log('--- Starting Ticket Creation Process ---');
  try {
    if (!guild) throw new Error('Guild is missing.');
    if (!user) throw new Error('User is invalid or missing.');
    if (!imageBuffer) throw new Error('Image buffer is missing.');
    if (!failures || failures.length === 0) throw new Error('Failures list is missing or empty.');

    // Fetch configuration
    const config = await Config.findOne({ guildId: guild.id });
    if (!config || !config.ticketCategoryId || !config.roleId) {
      throw new Error('Configuration is incomplete. Set roleId and ticketCategoryId using /config-system.');
    }

    // Check if the user already has an open ticket
    const existingTicket = await Ticket.findOne({ guildId: guild.id, userId: user.id });
    if (existingTicket) {
      throw new Error(`User ${user.tag} already has an open ticket: ${existingTicket.ticketId}`);
    }

    // Fetch the next ticket number
    const counterName = 'ticket';
    const ticketCounter = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const ticketNumber = ticketCounter.value.toString().padStart(3, '0');
    const ticketId = `verf-${ticketNumber}`;

    // Calculate time in server and account age
    const member = await guild.members.fetch(user.id);
    const joinedAt = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'N/A';
    const accountCreatedAt = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`;

    // Create the ticket in the specified category
    const category = guild.channels.cache.get(config.ticketCategoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      throw new Error('Invalid ticket category configured.');
    }

    const channel = await guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: category,
      topic: `Ticket for ${user.tag}`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
        {
          id: config.roleId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
      ],
    });

    // Save ticket information
    await Ticket.create({
      guildId: guild.id,
      userId: user.id,
      ticketId: channel.id,
    });

    // Build and send embed
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'submission.png' });
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle(`Ticket for ${user.tag}`)
      .addFields(
        { name: 'Failures Detected', value: failures.join('\n'), inline: false },
        { name: 'Time in Server', value: joinedAt, inline: true },
        { name: 'Account Age', value: accountCreatedAt, inline: true }
      )
      .setImage('attachment://submission.png');

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('verify').setLabel('Verify').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('decline').setLabel('Decline').setStyle(ButtonStyle.Danger)
      );

    await channel.send({ embeds: [embed], files: [attachment], components: [buttons] });

    console.log('Ticket creation process completed successfully.');
  } catch (error) {
    console.error('Error creating ticket:', error.message);
  } finally {
    console.log('--- End of Ticket Creation Process ---');
  }
}

module.exports = createTicket;
