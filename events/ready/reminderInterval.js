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
					if (reminder.limit)
						if (reminder.limit >= 1) {
							if (reminder.limit - 1 === 0) {
								// Delete the reminder
								reminderManager.delete(reminder._id);
								// Subtract the repeat count
								reminder.limit--;
							} else {
								// Update the reminder
								reminderManager.update(reminder._id, { $inc: { limit: -1 } });
								// Subtract the repeat count
								reminder.limit--;
							}
						}
						// Delete the reminder (since we reached the repeat limit)
						else return reminderManager.delete(reminder._id);

					// Increment the timestamp
					reminderManager.update(reminder._id, { timestamp: jt.parseTime(reminder.time, { fromNow: true }) });
				}
				// Delete the reminder (since it's not set to repeat)
				else reminderManager.delete(reminder._id);

				/* - - - - - { Send the Reminder } - - - - - */
				client.users.fetch(reminder.user_id).then(async user => {
					let channel = null;
					if (reminder.channel_id) channel = await guild.channels.fetch(reminder.channel_id).catch(() => null);

					// prettier-ignore
					// Create the embed :: { REMINDER }
					let embed_reminder = new BetterEmbed({
						channel, title: `⏰ Reminder: ${reminder.name}`,
                        description: `${jt.eta(Date.now() - jt.parseTime(reminder.time))} you wanted to be reminded of "${reminder.name}".`,
                        footer: `id: ${reminder._id} ${reminder.repeat ? reminder.limit !== null ? `• repeat: ${reminder.limit} more ${reminder.limit === 1 ? "time" : "times"}` : "• repeat: ✅" : ""}`,
                        timestamp: true
                    });

                    let messageContent = `${user} you have a reminder for **${reminder.name}**!`;

					// Send the notification to the fetched channel
					if (channel) return await embed_reminder.send({ messageContent, sendMethod: "channel" });
					// Send the notification to the user's DMs
					else return await user.send({ embeds: [embed_reminder] });
				}).catch(err => logger.error("Failed to send reminder", `id: '${reminder._id}' | guild: '${reminder.guild_id}' | user: '${reminder.user_id}'`, err)); // prettier-ignore
			}
		};

		// Set an interval for checking reminders every 5 seconds
		setInterval(async () => {
			// Fetch every guild the client's currently in
			let oAuth2Guilds = await client.guilds.fetch();
			let guilds = await Promise.all(oAuth2Guilds.map(o => client.guilds.fetch(o.id)));

			// Check for reminders in all of them
			for (let guild of guilds) checkRemindersInGuild(guild);
		}, 5000);
	}
};
