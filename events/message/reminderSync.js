const { Client, Message, Events } = require("discord.js");
const { messageToArray } = require("../../utils/discordTools");
const { reminderManager } = require("../../utils/mongo");
const jt = require("../../utils/jsTools");

const config = { reminder: require("../../configs/config_reminder.json") };

/** @type {import("../../configs/typedefs.js").EventExports} */
module.exports = {
	name: "reminderSync",
	eventType: Events.MessageCreate,

	/** @param {Client} client @param {Message} message */
	execute: async (client, message) => {
		if (!config.reminder.SYNC_CHECK_ENABLED) return;

		// Filter out non-guild, non-user messages, and non-command messages
		if (!message?.guild || !message?.author || !message?.author?.bot) return;

		// Fetch sync reminders, if any
		let reminders = (await reminderManager.fetchSyncedInGuild(message.guild.id)).filter(r => r?.enabled);
		if (!reminders.length) return;

		// prettier-ignore
		// Iterate through the reminders
		await Promise.all(reminders.map(async r => {
            // Check if the message is from the bot the user enabled sync for
			if (message.author.id !== r.sync_bot_id) return;
			
			// Check if this reminder requires an interaction
			if (r.sync_type === reminderManager.SyncType.SLASH_COMMAND) {
				// Check if the message was a slash command
				if (!message?.interaction) return;
				
				// Check if the required command was used
				if (message.interaction.commandName !== r.sync_command_name) return;

				// Check if the command was used by the right user
				if (message.interaction.user.id !== r.user_id) return;
			}

            /* - - - - - { Check for Cooldown Keywords } - - - - - */
            // Check if the first embed contains anything suggesting the user's still on cooldown
			let embedContent = messageToArray(message, 1);

			for (regex of config.reminder.COOLDOWN_REGEX)
				for (str of embedContent)
					if (new RegExp(regex, "g").test(str))
						return;

            // Check if the message matches what we're looking for
			if (r.sync_type === reminderManager.SyncType.PREFIX_COMMAND) {
				// Check if we can further verify by seeing if the bot replied to the user
				if (message.reference) {
					// Fetch the reply
					let reply = await message.fetchReference().catch(() => null);
					// Check if the reply's author is the same one that set up the reminder
					if (reply && reply.author.id !== r.user_id) return;
				}

				// Check if the message content includes the user's name, if set
				if (r.sync_message_content_includes_name)
					for (str of embedContent)
						if (new RegExp(r.sync_message_content_includes_name, "g").test(str))
							return;

				let _matchPoints = 0;

				for (let strToMatch of r.sync_message_content)
					if (embedContent.includes(strToMatch)) _matchPoints++;

				// Return if not enough of the message matched
				if (_matchPoints < Math.floor(embedContent.length / 2)) return;
			}

            // Reset the timer for the reminder
            await reminderManager.edit(r._id, { timestamp: jt.parseTime(r.raw_time, { fromNow: true }) });

            // React to the message to let the user know we're here
            message.react("⏰").catch(() => null);
        }));
	}
};
