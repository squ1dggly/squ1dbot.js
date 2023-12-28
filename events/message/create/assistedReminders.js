/** @file An example of an event function */

const { Client, Message } = require("discord.js");
const { reminderManager } = require("../../../modules/mongo");
const jt = require("../../../modules/jsTools");

const returnKeywords = ["cooldown", "cd"];
const returnRegexes = [/wait [0-9]+ (sec|min|hour|day|week)/g, /in [0-9]+ (sec|min|hour|day|week)/g];

module.exports = {
	name: "assistedReminders",
	event: "message_create",

	/** @param {Client} client @param {{message:Message}} args */
	execute: async (client, args) => {
		// prettier-ignore
		// Filter out non-guild, and non-user messages, and non-command messages
		if (!args.message?.guild || !args.message?.author || !args.message?.author?.bot || !args.message?.interaction) return;

		// Fetch assisted reminders, if any
		let reminders = await reminderManager.fetchAllAssistedInGuild(args.message.author.id, args.message.guild);
		if (!reminders.length) return;

		// prettier-ignore
		// Iterate through the reminders
		await Promise.all(reminders.map(async r => {
            // Check if the message is from the bot the user enabled assistance on
            if (args.message.interaction.user.id !== r.assisted_command_bot_id) return;
            // Check if the command used is what the user enabled assistance on
            if (args.message.interaction.commandName !== r.assisted_command_name) return;

            /* - - - - - { Check for Cooldown Keywords } - - - - - */
            for (let keyword in returnKeywords)
                if (args.message.content.toLowerCase().includes(keyword)) return;
            
            for (let regex in returnRegexes)
                if (args.message.content.toLowerCase().match(regex).length) return;
            
            // Reset the timer for the reminder
            await reminderManager.update(r._id, { timestamp: jt.parseTime(r.time) });

            // React to the message to let the user know we're here
            args.message.react("⏰").catch(() => null);
        }));
	}
};
