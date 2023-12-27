/** @file Executed as soon as the bot's connected to Discord @author xsqu1znt */

const { Client } = require("discord.js");
const { BetterEmbed } = require("../../modules/discordTools");
const { reminderManager } = require("../../modules/mongo");
const logger = require("../../modules/logger");
const jt = require("../../modules/jsTools");

module.exports = {
	name: "reminderInterval",
	event: "ready",

	/** @param {Client} client  */
	execute: async client => {
		const checkRemindersInGuild = async guild => {
			// Fetch the active reminders in the guild
			let reminders = await reminderManager.fetchAllActiveInGuild(guild.id);
			if (!reminders.length) return;

			for (let reminder of reminders) {
				// Check if the reminder is repeating
				if (reminder.repeat) {
					// Check if repeat is set to a limit
					if (reminders.repeat_count > 0)
						// Subtract the repeat count
						reminderManager.update(reminder._id, { $increment: { repeat_count: -1 } });
					// Delete the reminder (since we reached the repeat limit)
					else reminderManager.delete(reminder._id);

					// Increment the timestamp
					reminderManager.update(reminder._id, { timestamp: jt.parseTime(reminder.time, { fromNow: true }) });
				}
				// Delete the reminder (since it's not set to repeat)
				else reminderManager.delete(reminder._id);

				/* - - - - - { Send the Reminder } - - - - - */
				client.users.fetch(reminder.user_id).then(async user => {
					let channel = null;
					if (reminder.channel_id) channel = await guild.channels.fetch(reminder.channel_id);

					// prettier-ignore
					// Create the embed :: { REMINDER }
					let embed_reminder = new BetterEmbed({
						channel, title: "⏰ Reminder",
                        description: `${jt.eta(Date.now() - jt.parseTime(reminder.time))} you wanted to be reminded of "${reminder.name}".`,
                        footer: `id: ${reminder._id}`
                    });

					let messageContent = `${user} you have a reminder for **${reminder.name}**!`;

					// Send the notification to the fetched channel
					if (channel) return await embed_reminder.send({ content: messageContent, sendMethod: "channel" });
					// Send the notification to the user's DMs
					else return await user.send({ content: messageContent, embeds: [embed_reminder] });
				});
			}
		};

		// Set an interval for checking reminders every 5 seconds
		setInterval(async () => {
			// Fetch every guild the client's in
			let guilds = await client.guilds.fetch();

            // Check for reminders in all of them
			for (let guild of guilds) checkRemindersInGuild(guild);
		}, 5000);
	}
};
