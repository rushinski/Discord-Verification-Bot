const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');

module.exports = function(client) {
  const eventsDir = path.join(__dirname, '../events'); // Adjust this path if necessary

  // Check if the events directory exists
  if (!fs.existsSync(eventsDir)) {
    console.log('Events directory does not exist.');
    return;
  }

  // Read all files in the events directory
  const eventFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith('.js'));

  if (eventFiles.length === 0) {
    console.log('No event files found.');
    return;
  }

  for (const file of eventFiles) {
    const filePath = path.join(eventsDir, file);
    const event = require(filePath);

    // Check for valid event name and execute function
    if (typeof event.name !== 'string' || typeof event.execute !== 'function') {
      console.log(`Could not load ${file}: Missing event name or execute function.`);
      continue;
    }

    const eventName = Events[event.name] || event.name;

    // Validate if the event name is valid within Discord.js
    if (!Object.values(Events).includes(eventName) && !Object.keys(Events).includes(eventName)) {
      console.log(`Invalid event name "${event.name}" - Unknown to Discord.js.`);
      continue;
    }

    try {
      // Register the event: use 'once' or 'on' based on event.once property
      client[event.once ? 'once' : 'on'](eventName, (...args) => event.execute(...args));
      console.log(`Loaded event: ${event.name}`);
    } catch (error) {
      console.error(`Error loading event "${event.name}":`, error);
    }
  }

  console.log(`Loaded ${eventFiles.length} events!`);
};
