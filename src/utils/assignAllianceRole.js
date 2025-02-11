const { GuildMember } = require('discord.js');
const Config = require('../models/Config');
const Keyword = require('../models/Keyword'); // Ensure correct import

/**
 * Assign roles based on keyword match and default verified role.
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

    // Assign the default verified role
    if (config.verifiedRoleId) {
      const verifiedRole = await member.guild.roles.fetch(config.verifiedRoleId);
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

      // Fetch all keywords for debugging
      const allKeywords = await Keyword.find({ guildId: member.guild.id });
      console.log('All stored keywords for this guild:', allKeywords);

      // Find the keyword document where roleId matches matchedKeyword
      const keywordDoc = await Keyword.findOne({
        guildId: member.guild.id,
        roleId: String(matchedKeyword), // We are now searching by roleId instead of keyword
      });

      if (keywordDoc) {
        const keywordRole = await member.guild.roles.fetch(keywordDoc.roleId);
        if (keywordRole) {
          await member.roles.add(keywordRole);
          console.log(`Role "${keywordDoc.roleId}" assigned to ${member.user.tag} (linked to keyword "${keywordDoc.keyword}")`);
        } else {
          console.warn(`Role ID "${keywordDoc.roleId}" not found in the guild.`);
        }
      } else {
        console.warn(`No keyword is linked to role ID "${matchedKeyword}". Skipping role assignment.`);
      }
    } else {
      console.warn(`No keyword matched for ${member.user.tag}. Skipping keyword-based role assignment.`);
    }
  } catch (error) {
    console.error('Error assigning roles:', error);
  }
}

module.exports = assignAllianceRoles;
