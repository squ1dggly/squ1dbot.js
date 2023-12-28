/** @file Executed as soon as the bot's connected to Discord @author xsqu1znt */

const { Client, PermissionFlagsBits } = require("discord.js");
const { BetterEmbed } = require("../../modules/discordTools");
const { reminderManager } = require("../../modules/mongo");
const logger = require("../../modules/logger");
const jt = require("../../modules/jsTools");

const greetings = [
	'Why hello there! Don\'t forget about "$REMINDER"!',
	'Hey there! I heard you wanted to be reminded of "$REMINDER"!',
	'I think it\'s time for "$REMINDER". If you know what I mean. 😎',
	'Yo! I heard it\'s time for "$REMINDER".',
	'I believe some time ago you requested to be notified of "$REMINDER". So, here you go I guess.',
	'Once upon a time... "$REMINDER"! 🌠',
];

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
                        // description: `Hey there! I heard you wanted to be reminded of "${reminder.name}"!`,
                        description: jt.choice(greetings).replace("$REMINDER", reminder.name),
                        footer: `id: ${reminder._id} ${reminder.repeat ? reminder.limit !== null ? `• repeat: ${reminder.limit} more ${reminder.limit === 1 ? "time" : "times"}` : "• repeat: ✅" : ""}`,
                        timestamp: true
                    });

					let messageContent = `${user} you have a reminder for **${reminder.name}**!`;
					
					let userHasPermission = channel
						? channel.permissionsFor(user).has(PermissionFlagsBits.SendMessages)
						: null;

					let clientHasPermission = channel
						? channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
						: null;

					// Send the notification to the fetched channel
					if (channel && userHasPermission && clientHasPermission)
						return await channel.send({ content: messageContent, embeds: [embed_reminder] })
							// Send the notification to the user's DMs
							.catch(async () => await user.send({
								content: `I couldn't send your reminder to ${channel}, so here's your reminder!`,
								embeds: [embed_reminder]
							}));
					else {
						let error = channel && !userHasPermission && !clientHasPermission
							? `I couldn't send your reminder to ${channel}, so here's your reminder!`
							: undefined;

						// Send the notification to the user's DMs
						return await user.send({ content: error, embeds: [embed_reminder] });
					}
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
