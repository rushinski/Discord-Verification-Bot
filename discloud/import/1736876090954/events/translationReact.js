const { EmbedBuilder } = require('discord.js');
const translate = require('@iamtraction/google-translate');

const emojiLanguageMap = {
  '🇬🇧': 'en', '🇺🇸': 'en', '🇦🇺': 'en', '🇨🇦': 'en', '🇳🇿': 'en', '🇮🇪': 'en',
  '🇨🇵': 'fr', '🇫🇷': 'fr', '🇩🇪': 'de', '🇪🇸': 'es', '🇮🇹': 'it', '🇵🇹': 'pt', '🇷🇴': 'ro',
  '🇳🇱': 'nl', '🇸🇪': 'sv', '🇵🇱': 'pl', '🇭🇺': 'hu', '🇫🇮': 'fi', '🇩🇰': 'da',
  '🇨🇿': 'cs', '🇳🇴': 'no', '🇬🇷': 'el', '🇯🇵': 'ja', '🇰🇷': 'ko', '🇨🇳': 'zh-CN',
  '🇹🇼': 'zh-TW', '🇮🇳': 'hi', '🇻🇳': 'vi', '🇹🇭': 'th', '🇮🇩': 'id', '🇮🇱': 'he',
  '🇵🇭': 'tl', '🇸🇦': 'ar', '🇦🇪': 'ar', '🇷🇺': 'ru', '🇺🇦': 'uk', '🇧🇾': 'be',
  '🇷🇸': 'sr', '🇧🇬': 'bg', '🇸🇰': 'sk', '🇸🇮': 'sl', '🇭🇷': 'hr', '🇲🇰': 'mk',
  '🇿🇦': 'af', '🇳🇬': 'yo', '🇰🇪': 'sw', '🇪🇬': 'ar', '🇹🇷': 'tr', '🇧🇷': 'pt',
  '🇲🇽': 'es'
};

const languageNames = {
  'en': 'English 🇬🇧', 'fr': 'French 🇫🇷', 'de': 'German 🇩🇪', 'es': 'Spanish 🇪🇸', 'it': 'Italian 🇮🇹',
  'pt': 'Portuguese 🇵🇹', 'ro': 'Romanian 🇷🇴', 'nl': 'Dutch 🇳🇱', 'sv': 'Swedish 🇸🇪', 'pl': 'Polish 🇵🇱',
  'hu': 'Hungarian 🇭🇺', 'fi': 'Finnish 🇫🇮', 'da': 'Danish 🇩🇰', 'cs': 'Czech 🇨🇿', 'no': 'Norwegian 🇳🇴',
  'el': 'Greek 🇬🇷', 'ja': 'Japanese 🇯🇵', 'ko': 'Korean 🇰🇷', 'zh-CN': 'Simplified Chinese 🇨🇳',
  'zh-TW': 'Traditional Chinese 🇹🇼', 'hi': 'Hindi 🇮🇳', 'vi': 'Vietnamese 🇻🇳', 'th': 'Thai 🇹🇭',
  'id': 'Indonesian 🇮🇩', 'he': 'Hebrew 🇮🇱', 'tl': 'Filipino 🇵🇭', 'ar': 'Arabic 🇸🇦', 'ru': 'Russian 🇷🇺',
  'uk': 'Ukrainian 🇺🇦', 'be': 'Belarusian 🇧🇾', 'sr': 'Serbian 🇷🇸', 'bg': 'Bulgarian 🇧🇬', 'sk': 'Slovak 🇸🇰',
  'sl': 'Slovenian 🇸🇮', 'hr': 'Croatian 🇭🇷', 'mk': 'Macedonian 🇲🇰', 'af': 'Afrikaans 🇿🇦', 'yo': 'Yoruba 🇳🇬',
  'sw': 'Swahili 🇰🇪', 'tr': 'Turkish 🇹🇷'
};

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    const { message, emoji } = reaction;
    const languageCode = emojiLanguageMap[emoji.name];

    if (!languageCode) return;

    try {
      const notifyMessage = await message.reply({
        content: `Reaction detected! Translating to ${emoji.name}...`,
      });

      // Translate to English first to infer the original language
      const detectedTranslation = await translate(message.content, { to: 'en' });
      const originalLanguageCode = detectedTranslation.from.language.iso;
      const originalLanguageName = languageNames[originalLanguageCode] || 'Unknown Language';

      // Translate to the target language
      const translated = await translate(message.content, { to: languageCode });
      const translatedLanguageName = languageNames[languageCode] || 'Unknown Language';

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('Translation Successful')
        .addFields(
          {
            name: `Original Text (${originalLanguageName})`,
            value: message.content || 'No text provided.',
          },
          {
            name: `Translated Text (${translatedLanguageName})`,
            value: translated.text || 'Translation failed.',
          }
        )
        .setFooter({
          text: `${user.username}`,
          iconURL: user.displayAvatarURL({ dynamic: true }),
        });

      if (notifyMessage.deletable) {
        setTimeout(() => notifyMessage.delete().catch(() => {}), 5000);
      }

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error translating message:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Translation Failed')
        .setDescription(
          'An error occurred while attempting to translate the message. Please try again later or contact support.'
        )
        .setFooter({
          text: `${user.username}`,
          iconURL: user.displayAvatarURL({ dynamic: true }),
        });

      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
