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
		let reminders = await reminderManager.fetchAllAssistedInGuild(
			args.message.interaction.user.id,
			args.message.guild.id,
			args.message.interaction.commandName
		);

		if (!reminders.length) return;

		// prettier-ignore
		// Iterate through the reminders
		await Promise.all(reminders.map(async r => {
            // Check if the message is from the bot the user enabled assistance on
            if (args.message.interaction.user.id !== r.assisted_command_bot_id) return;

            /* - - - - - { Check for Cooldown Keywords } - - - - - */
            for (let keyword in returnKeywords) {
                // Message content
                if (args.message.content.toLowerCase().includes(keyword)) return;

                // Check the first embed
                if (args.message.embeds[0]) {
                    // Title
                    if (args.message.embeds[0]?.title && args.message.embeds[0].title.toLowerCase().includes(keyword)) return;
                    // Description
                    if (args.message.embeds[0]?.description && args.message.embeds[0].description.toLowerCase().includes(keyword)) return;

                    // Fields
                    if (args.message.embeds[0]?.fields)
                        for (let field of args.message.embeds[0].fields) {
                            // Name
                            if (field?.name && field.name.toLowerCase().includes(keyword)) return;
                            // Value
                            if (field?.value && field.value.toLowerCase().includes(keyword)) return;
                        }
                }
            }
            
            for (let regex in returnRegexes) {
                // Message content
                if (args.message.content.toLowerCase().match(regex)) return;

                // Check the first embed
                if (args.message.embeds[0]) {
                    // Title
                    if (args.message.embeds[0]?.title && args.message.embeds[0].title.toLowerCase().match(regex)) return;
                    // Description
                    if (args.message.embeds[0]?.description && args.message.embeds[0].description.toLowerCase().match(regex)) return;

                    // Fields
                    if (args.message.embeds[0]?.fields)
                        for (let field of args.message.embeds[0].fields) {
                            // Name
                            if (field?.name && field.name.toLowerCase().match(regex)) return;
                            // Value
                            if (field?.value && field.value.toLowerCase().match(regex)) return;
                        }
                }
            }
            
            // Reset the timer for the reminder
            await reminderManager.update(r._id, { timestamp: jt.parseTime(r.time, { fromNow: true }) });

            // React to the message to let the user know we're here
            args.message.react("⏰").catch(() => null);
        }));
	}
};
