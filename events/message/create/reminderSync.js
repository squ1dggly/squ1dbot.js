const { Client, Message } = require("discord.js");
const { messageContentToArray } = require("../../../modules/discordTools");
const { reminderManager } = require("../../../modules/mongo");
const jt = require("../../../modules/jsTools");

const config = { reminder: require("../../../configs/config_reminder.json") };

module.exports = {
	name: "reminderSync",
	event: "message_create",

	/** @param {Client} client @param {{message:Message}} args */
	execute: async (client, args) => {
		if (!config.reminder.SYNC_CHECK_ENABLED) return;

		// Filter out non-guild, non-user messages, and non-command messages
		if (!args.message?.guild || !args.message?.author || !args.message?.author?.bot) return;

		// Fetch sync reminders, if any
		let reminders = (await reminderManager.fetchSyncedInGuild(args.message.guild.id)).filter(r => r?.enabled);
		if (!reminders.length) return;

		// prettier-ignore
		// Iterate through the reminders
		await Promise.all(reminders.map(async r => {
            // Check if the message is from the bot the user enabled sync for
			if (args.message.author.id !== r.sync_bot_id) return;
			
			// Check if this reminder requires an interaction
			if (r.sync_type === reminderManager.SyncType.SLASH_COMMAND) {
				// Check if the message was a slash command
				if (!args.message?.interaction) return;
				
				// Check if the required command was used
				if (args.message.interaction.commandName !== r.sync_command_name) return;

				// Check if the command was used by the right user
				if (args.message.interaction.user.id !== r.user_id) return;
			}

            /* - - - - - { Check for Cooldown Keywords } - - - - - */
            // Check if the first embed contains anything suggesting the user's still on cooldown
			let embedContent = messageContentToArray(args.message, 1);

			for (regex of config.reminder.COOLDOWN_REGEX)
				for (str of embedContent)
					if (new RegExp(regex, "g").test(str))
						return;

            // Check if the message matches what we're looking for
			if (r.sync_type === reminderManager.SyncType.PREFIX_COMMAND) {
				// Check if we can further verify by seeing if the bot replied to the user
				if (args.message.reference) {
					// Fetch the reply
					let reply = await args.message.fetchReference().catch(() => null);
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
            args.message.react("⏰").catch(() => null);
        }));
	}
};
