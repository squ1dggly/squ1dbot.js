/** @file An example of an event function */

const { Client, Message } = require("discord.js");
const { messageContentToArray } = require("../../../modules/discordTools");
const { reminderManager } = require("../../../modules/mongo");
const jt = require("../../../modules/jsTools");

const config = { reminder: require("../../../configs/config_reminder.json") };

module.exports = {
	name: "assistedReminders",
	event: "message_create",

	/** @param {Client} client @param {{message:Message}} args */
	execute: async (client, args) => {
		// prettier-ignore
		// Filter out non-guild, and non-user messages, and non-command messages
		if (!args.message?.guild || !args.message?.author || !args.message?.author?.bot || !args.message?.interaction) return;

		// Fetch sync reminders, if any
		let reminders = await reminderManager.fetchSyncForUserInGuild(
			args.message.interaction.user.id,
			args.message.guild.id
		);

		if (!reminders.length) return;

		// prettier-ignore
		// Iterate through the reminders
		await Promise.all(reminders.map(async r => {
            // Check if the message is from the bot the user enabled sync for
            if (args.message.author.id !== r.sync_bot_id) return;

            /* - - - - - { Check for Cooldown Keywords } - - - - - */
            // Check if the first embed contains anything suggesting the user's still on cooldown
            let embedContent = messageContentToArray(args.message, 1);

            for (keyword of config.reminder.COOLDOWN_KEYWORDS)
                if (embedContent.includes(keyword)) return;
            
            for (regex of config.reminder.COOLDOWN_REGEX)
                if (embedContent.includes(new Regexp(regex))) return;

            // Check if the message matches what we're looking for
            
            
            // Reset the timer for the reminder
            await reminderManager.update(r._id, { timestamp: jt.parseTime(r.time, { fromNow: true }) });

            // React to the message to let the user know we're here
            args.message.react("⏰").catch(() => null);
        }));
	}
};
