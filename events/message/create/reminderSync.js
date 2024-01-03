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
		// Filter out non-guild, and non-user messages, and non-command messages
		if (!args.message?.guild || !args.message?.author || !args.message?.author?.bot) return;

		// Fetch sync reminders, if any
		let reminders = await reminderManager.fetchSyncedInGuild(args.message.guild.id);
		console.log(reminders);
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

            for (keyword of config.reminder.COOLDOWN_KEYWORDS)
                if (embedContent.includes(keyword)) return;
            
            for (regex of config.reminder.COOLDOWN_REGEX)
                if (embedContent.includes(new Regexp(regex))) return;

            // Check if the message matches what we're looking for
			if (r.sync_type === reminderManager.SyncType.PREFIX_COMMAND) {
				// Check if the message content includes the user's name, if set
				if (r.sync_message_content_includes_name)
					if (!embedContent.includes(new RegExp(`/${r.sync_message_content_includes_name}/g`)))
						return;

				let _matchPoints = 0;

				for (let strToMatch of r.sync_message_content)
					if (embedContent.includes(strToMatch)) _matchPoints++;

				// Return if not enough of the message matched
				if (_matchPoints < Math.floor(embedContent.length / 2)) return;
			}

            // Reset the timer for the reminder
            await reminderManager.update(r._id, { timestamp: jt.parseTime(r.raw_time, { fromNow: true }) });

            // React to the message to let the user know we're here
            args.message.react("⏰").catch(() => null);
        }));
	}
};
