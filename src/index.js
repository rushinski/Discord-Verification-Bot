const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const registerCommands = require('./utils/registerCommands');
const loadEvents = require('./utils/loadEvents');

// Load environment variables
dotenv.config();

// Environment variables
const { MONGOURL, BOT_TOKEN } = process.env;

// MongoDB connection
mongoose.connect(MONGOURL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Map(); // Map to store commands
client.components = {};      // Object to store components (buttons, modals, etc.)

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await registerCommands(client); // Register slash commands
});

// Load events
loadEvents(client);

// Login to Discord
client.login(BOT_TOKEN).catch(err => {
  console.error('Discord bot login error:', err);
});

module.exports = client;
