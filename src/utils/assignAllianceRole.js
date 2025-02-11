const { GuildMember } = require('discord.js');
const Config = require('../models/Config');
const Keyword = require('../models/Keyword'); // Ensure correct import

/**
 * Assign roles based on keyword match and default kingdom role.
 * @param {GuildMember} member - The Discord member to assign roles to.
 * @param {string} matchedKeyword - The keyword that was matched (optional).
 */
async function assignAllianceRoles(member, matchedKeyword) {
  try {
    if (!member) {
      console.warn('Invalid member provided. Cannot assign roles.');
      return;
    }

    const config = await Config.findOne({ guildId: member.guild.id });
    console.log('Retrieved Config:', config);

    if (!config) {
      console.warn('Configuration not found for this guild. Cannot assign roles.');
      return;
    }

    // Assign the default Kingdom Member role
    if (config.kingdomMemberRoleId) {
      const kingdomRole = await member.guild.roles.fetch(config.kingdomMemberRoleId);
      if (kingdomRole) {
        await member.roles.add(kingdomRole);
        console.log(`Kingdom Member role assigned to ${member.user.tag}`);
      } else {
        console.warn('Kingdom Member role not found in guild roles.');
      }
    }

    // Assign a role based on the matched keyword (if available)
    if (matchedKeyword) {
      console.log('Matched Keyword:', matchedKeyword);

      const keywordDoc = await Keyword.findOne({
        guildId: member.guild.id,
        roleId: String(matchedKeyword), // Searching by role ID
      });

      if (keywordDoc && keywordDoc.roleId) {
        const keywordRole = await member.guild.roles.fetch(keywordDoc.roleId);
        if (keywordRole) {
          await member.roles.add(keywordRole);
          console.log(`Role "${keywordDoc.roleId}" assigned to ${member.user.tag} (linked to keyword "${keywordDoc.keyword}")`);
        } else {
          console.warn(`Role ID "${keywordDoc.roleId}" not found in the guild.`);
        }
      } else {
        console.warn(`No keyword-linked role found for "${matchedKeyword}".`);
      }
    }
  } catch (error) {
    console.error('Error assigning roles:', error);
  }
}


module.exports = assignAllianceRoles;
