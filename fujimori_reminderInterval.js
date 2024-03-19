const { Client, Events } = require("discord.js");
const { BetterEmbed } = require("../../../modules/discordTools");
const { reminderManager } = require("../../../modules/mongo");
const logger = require("../../../modules/logger");
const jt = require("../../../modules/jsTools");

const INTERVAL_CHECK_ENABLED = true;
const INTERVAL = "10s";

module.exports = {
	name: "reminderInterval",
	event: Events.ClientReady,

	/** @param {Client} client  */
	execute: async client => {
		const checkReminders = async () => {
			// Fetch every reminder in the reminder collection
			let reminders = await reminderManager.fetchAll();
			if (!reminders.length) return;

			for (let reminder of reminders) {
				// Ignore reminders that aren't up
				if (!reminder.timestamp > Date.now()) continue;

				// Delete the reminder (since it's not supposed to repeat, (and i'm not writing code for that))
				reminderManager.delete(reminder._id);

				// prettier-ignore
				// Determine the operation based on the type
				switch (reminder.type) {
                    case "user_unmute":
                        // TODO: insert the dilf-fucking unmute code and stop shoving your dick up your ass
                        
						// Continue with whatever the fuck you wanna do after this switch case statement
                        break;

                    case "daily":
                        client.users.fetch(reminder.user_id).then(async user => {
                            if (!user) return logger.error("Failed not fetch user to DM their daily reminder", `user: '${reminder.user_id}'`);

                            // prettier-ignore
                            // Create the embed :: { DAILY REMINDER }
                            let embed_reminder = new BetterEmbed({
                                title: "⏰ Reminder",
                                description: `Your dad's a hoe, and your daily's ready you fucking cunt.`,
                                timestamp: true
                            });

                            // Send the notification to the user's DMs
                            return await guildMember.send({ content: error, embeds: [embed_reminder] });
                        }).catch(err => {
                            logger.error("Failed to send daily reminder", `id: '${reminder._id}' | user: '${reminder.user_id}'`, err)
                        });

                        // Continue with whatever the fuck you wanna do after this switch case statement
                        break;
				}
			}
		};

		// Set an interval for checking reminders
		if (INTERVAL_CHECK_ENABLED) setInterval(async () => checkReminders(), jt.parseTime(INTERVAL));
	}
};
