const { Client, Message, Events } = require("discord.js");
const { reminderManager } = require("../../utils/mongo");

const config = { reminder: require("../../configs/config_reminder.json") };

/** @type {import("../../configs/typedefs.js").EventExports} */
module.exports = {
	name: "reminderTrigger",
	event: Events.MessageCreate,

	/** @param {Client} client @param {Message} message */
	execute: async (client, message) => {
		if (!config.reminder.TRIGGERS_ENABLED) return;

		// Filter out non-guild, non-user messages, and command messages
		if (!message?.guild || !message?.author || message?.author?.bot) return;

		// Fetch the reminder triggers from the database for the message author
		let triggers = await reminderManager.trigger.fetchForUserByTriggerInGuild(
			message.author.id,
            message.guild.id,
            message.content.trim().toLowerCase()
        );

		if (!triggers.length) return;

        // Iterate through the fetched triggers and add them as reminders
        await Promise.all(triggers.map(async t => await reminderManager.addFromTrigger(t)));

        // React to the user's message letting them know we're here
        return await message.react("✅").catch(() => null);
	}
};
