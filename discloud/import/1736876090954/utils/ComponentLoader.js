const ReadFolder = require('./ReadFolder.js');
const { existsSync } = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField: { Flags: Permissions } } = require('discord.js');

const modules = [
	'commands',
	'buttons',
	'dropdowns',
	'modals',
];

module.exports = function (client) {
	for (const module of modules) {
		client[module] = new Map();

		if (!existsSync(`${__dirname}/../${module}`)) continue;

		const files = ReadFolder(module);
		for (const { path, data } of files) {
			try {
				if (!data.execute) throw new Error('No execute function found');
				if (typeof data.execute !== 'function') throw new Error('Execute is not a function');

				if (module === 'commands') {
					if (!(data.data instanceof SlashCommandBuilder)) throw new Error('Invalid command - Must use the slash command builder');
					client[module].set(data.data.name, data);
				} else {
					if (!data.customID) throw new Error('No custom ID has been set');
					if (typeof (data.customID ?? data.customId) !== 'string') throw new Error('Invalid custom ID - Must be string');
					client[module].set(data.customID, data);
				}
			} catch (error) {
				console.error(`[${module.toUpperCase()}] Failed to load ./${path}: ${error.stack || error.message}`);
			}
		}
		console.log(`Loaded ${client[module].size} ${module}`);
	}
};
