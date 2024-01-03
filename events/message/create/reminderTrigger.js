const { Client, Message } = require("discord.js");
const { messageContentToArray } = require("../../../modules/discordTools");
const { reminderManager } = require("../../../modules/mongo");
const jt = require("../../../modules/jsTools");

const config = { reminder: require("../../../configs/config_reminder.json") };

module.exports = {
	name: "reminderTrigger",
	event: "message_create",

	/** @param {Client} client @param {{message:Message}} args */
	execute: async (client, args) => {
		if (!config.reminder.TRIGGERS_ENABLED) return;

		// Filter out non-guild, non-user messages, and command messages
		if (!args.message?.guild || !args.message?.author || args.message?.author?.bot) return;

		// Fetch the reminder triggers from the database for the message author
		let triggers = await reminderManager.trigger.fetchForUserByTriggerInGuild(
			args.message.author.id,
            args.message.guild.id,
            args.message.content.trim().toLowerCase()
        );

		if (!triggers.length) return;

        // Iterate through the fetched triggers and add them as reminders
        await Promise.all(triggers.map(async t => await reminderManager.addFromTrigger(t)));

        // React to the user's message letting them know we're here
        return await args.message.react("✅").catch(() => null);
	}
};
