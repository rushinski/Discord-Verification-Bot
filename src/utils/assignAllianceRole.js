const { GuildMember } = require('discord.js');
const Config = require('../models/Config');

/**
 * Assign roles based on keyword match and default verified role.
 * @param {GuildMember} member - The Discord member to assign roles to.
 * @param {string} matchedKeyword - The keyword that was matched (optional).
 */
async function assignRoles(member, matchedKeyword) {
  try {
    const config = await Config.findOne({ guildId: member.guild.id });
    console.log('Retrieved Config:', config);

    if (!config) {
      console.warn('Configuration not found for this guild. Cannot assign roles.');
      return;
    }

    // Assign the default verified role
    if (config.verifiedRoleId) {
      const verifiedRole = member.guild.roles.cache.get(config.verifiedRoleId);
      console.log('Verified Role:', verifiedRole);
      if (verifiedRole) {
        await member.roles.add(verifiedRole);
        console.log(`Verified role assigned to ${member.user.tag}`);
      } else {
        console.warn('Verified role not found in guild roles.');
      }
    }

    // Assign a role based on the matched keyword
    if (matchedKeyword) {
      console.log('Matched Keyword:', matchedKeyword);
      const keywordRoleId = config.keywordRoles.get(matchedKeyword);
      console.log(`Keyword Role ID for "${matchedKeyword}":`, keywordRoleId);

      if (keywordRoleId) {
        const keywordRole = member.guild.roles.cache.get(keywordRoleId);
        console.log('Keyword Role:', keywordRole);

        if (keywordRole) {
          await member.roles.add(keywordRole);
          console.log(`Role for keyword "${matchedKeyword}" assigned to ${member.user.tag}`);
        } else {
          console.warn(`Role for keyword "${matchedKeyword}" not found in guild roles.`);
        }
      } else {
        console.warn(`No role configured for keyword "${matchedKeyword}".`);
      }
    } else {
      console.log(`No keyword matched for ${member.user.tag}.`);
    }
  } catch (error) {
    console.error('Error assigning roles:', error);
  }
}

module.exports = assignRoles;
