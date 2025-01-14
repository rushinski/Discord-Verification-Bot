const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides information on the translation feature.'),
    async execute(interaction) {
        const pages = [
            // Page 1: Front Page with Index and Ticket Info
            new EmbedBuilder()
            .setTitle('Translation Help - Front Page')
            .setColor(0xff0000)
            .setDescription(
                "**Welcome to the Translation Help!**\n\n" +
                "Here, you can learn how to use the translation features of the bot. This bot allows you to translate messages into various languages just by reacting with flag emojis! 🇬🇧, 🇫🇷, 🇩🇪, and more.\n\n" +
                "**How it works**:\n" +
                "1. React to a message with a country flag emoji (e.g., 🇫🇷 for French, 🇩🇪 for German).\n" +
                "2. The bot will automatically translate the message into the corresponding language.\n\n" +
                "**To request a translation in a language not listed here, please create a support ticket!**\n\n" +
                "**Index**:\n" +
                "1. Front Page/Index\n" +
                "2. English-Speaking Countries\n" +
                "3. European Languages\n" +
                "4. Asian Languages\n" +
                "5. Middle Eastern Languages\n" +
                "6. Slavic Languages\n" +
                "7. African & Other Languages\n\n" +
                "Click 'Next' to explore the languages available!"
            )            
                .setFooter({ text: 'Page 1 of 7' }),

            // Page 2: English-Speaking Countries
            new EmbedBuilder()
                .setTitle('Translation Help - Page 2')
                .setColor(0xff0000)
                .setDescription('**English-Speaking Countries**')
                .addFields(
                    { name: '🇬🇧 - United Kingdom', value: 'English', inline: false },
                    { name: '🇺🇸 - United States', value: 'English', inline: false },
                    { name: '🇦🇺 - Australia', value: 'English', inline: false },
                    { name: '🇨🇦 - Canada', value: 'English', inline: false },
                    { name: '🇳🇿 - New Zealand', value: 'English', inline: false },
                    { name: '🇮🇪 - Ireland', value: 'English', inline: false }
                )
                .setFooter({ text: 'Page 2 of 7' }),


            // Page 3: European Languages
            new EmbedBuilder()
                .setTitle('Translation Help - Page 3')
                .setColor(0xff0000)
                .setDescription('**European Languages**')
                .addFields(
                    { name: '🇫🇷 - France', value: 'French', inline: false },
                    { name: '🇩🇪 - Germany', value: 'German', inline: false },
                    { name: '🇪🇸 - Spain', value: 'Spanish', inline: false },
                    { name: '🇮🇹 - Italy', value: 'Italian', inline: false },
                    { name: '🇵🇹 - Portugal', value: 'Portuguese', inline: false },
                    { name: '🇷🇴 - Romania', value: 'Romanian', inline: false },
                    { name: '🇳🇱 - Netherlands', value: 'Dutch', inline: false },
                    { name: '🇸🇪 - Sweden', value: 'Swedish', inline: false },
                    { name: '🇵🇱 - Poland', value: 'Polish', inline: false },
                    { name: '🇭🇺 - Hungary', value: 'Hungarian', inline: false },
                    { name: '🇫🇮 - Finland', value: 'Finnish', inline: false },
                    { name: '🇩🇰 - Denmark', value: 'Danish', inline: false },
                    { name: '🇨🇿 - Czech Republic', value: 'Czech', inline: false },
                    { name: '🇳🇴 - Norway', value: 'Norwegian', inline: false },
                    { name: '🇬🇷 - Greece', value: 'Greek', inline: false },
                )
                .setFooter({ text: 'Page 3 of 7' }),

            // Page 4: Asian Languages
            new EmbedBuilder()
                .setTitle('Translation Help - Page 4')
                .setColor(0xff0000)
                .setDescription('**Asian Languages**')
                .addFields(
                    { name: '🇯🇵 - Japan', value: 'Japanese', inline: false },
                    { name: '🇰🇷 - South Korea', value: 'Korean', inline: false },
                    { name: '🇨🇳 - China', value: 'Chinese (Simplified)', inline: false },
                    { name: '🇹🇼 - Taiwan', value: 'Chinese (Traditional)', inline: false },
                    { name: '🇮🇳 - India', value: 'Hindi', inline: false },
                    { name: '🇻🇳 - Vietnam', value: 'Vietnamese', inline: false },
                    { name: '🇹🇭 - Thailand', value: 'Thai', inline: false },
                    { name: '🇮🇩 - Indonesia', value: 'Indonesian', inline: false },
                    { name: '🇮🇱 - Israel', value: 'Hebrew', inline: false },
                    { name: '🇵🇭 - Philippines', value: 'Filipino (Tagalog)', inline: false },
                )
                .setFooter({ text: 'Page 4 of 7' }),

            // Page 5: Middle Eastern Languages
            new EmbedBuilder()
                .setTitle('Translation Help - Page 5')
                .setColor(0xff0000)
                .setDescription('**Middle Eastern Languages**')
                .addFields(
                    { name: '🇸🇦 - Saudi Arabia', value: 'Arabic (Saudi Arabia)', inline: false },
                    { name: '🇦🇪 - UAE', value: 'Arabic (UAE)', inline: false },
                )
                .setFooter({ text: 'Page 5 of 7' }),

            // Page 6: Slavic Languages
            new EmbedBuilder()
                .setTitle('Translation Help - Page 6')
                .setColor(0xff0000)
                .setDescription('**Slavic Languages**')
                .addFields(
                    { name: '🇷🇺 - Russia', value: 'Russian', inline: false },
                    { name: '🇺🇦 - Ukraine', value: 'Ukrainian', inline: false },
                    { name: '🇧🇾 - Belarus', value: 'Belarusian', inline: false },
                    { name: '🇷🇸 - Serbia', value: 'Serbian', inline: false },
                    { name: '🇧🇬 - Bulgaria', value: 'Bulgarian', inline: false },
                    { name: '🇸🇰 - Slovakia', value: 'Slovak', inline: false },
                    { name: '🇸🇮 - Slovenia', value: 'Slovenian', inline: false },
                    { name: '🇭🇷 - Croatia', value: 'Croatian', inline: false },
                    { name: '🇲🇰 - North Macedonia', value: 'Macedonian', inline: false },
                )
                .setFooter({ text: 'Page 6 of 7' }),

            // Page 7: African & Other Languages
            new EmbedBuilder()
                .setTitle('Translation Help - Page 7')
                .setColor(0xff0000)
                .setDescription('**African & Other Languages**')
                .addFields(
                    { name: '🇿🇦 - South Africa', value: 'Afrikaans', inline: false },
                    { name: '🇳🇬 - Nigeria', value: 'Yoruba', inline: false },
                    { name: '🇰🇪 - Kenya', value: 'Swahili', inline: false },
                    { name: '🇪🇬 - Egypt', value: 'Arabic (Egypt)', inline: false },
                    { name: '🇹🇷 - Turkey', value: 'Turkish', inline: false },
                    { name: '🇧🇷 - Brazil', value: 'Portuguese (Brazil)', inline: false },
                    { name: '🇲🇽 - Mexico', value: 'Spanish (Mexico)', inline: false },
                )
                .setFooter({ text: 'Page 7 of 7' }),
        ];

        let currentPage = 0;

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === pages.length - 1)
        );

        const message = await interaction.reply({
            embeds: [pages[currentPage]],
            components: [buttons],
            ephemeral: true,
        });

        const collector = message.createMessageComponentCollector({
            time: 60000,
        });

        collector.on('collect', async (btnInteraction) => {
            if (btnInteraction.customId === 'previous') {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (btnInteraction.customId === 'next') {
                currentPage = Math.min(currentPage + 1, pages.length - 1);
            }

            await btnInteraction.update({
                embeds: [pages[currentPage]],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === pages.length - 1)
                    ),
                ],
            });
        });

        collector.on('end', async () => {
            await message.edit({
                components: [],
            });
        });
    },
};
