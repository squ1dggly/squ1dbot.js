/** @file Executed as soon as the bot's connected to Discord @author xsqu1znt */

const { Client, PermissionFlagsBits, Events } = require("discord.js");
const { BetterEmbed } = require("../../../modules/discordTools");
const { reminderManager } = require("../../../modules/mongo");
const logger = require("../../../modules/logger");
const jt = require("../../../modules/jsTools");

const config = { reminder: require("../../configs/config_reminder.json") };

module.exports = {
	name: "reminderInterval",
	event: Events.clientReady,

	/** @param {Client} client  */
	execute: async client => {
		const checkRemindersInGuild = async guild => {
			// Fetch the active reminders in the guild
			let reminders = await reminderManager.fetchActiveInGuild(guild.id);
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
								reminderManager.edit(reminder._id, { $inc: { limit: -1 } });
								// Subtract the repeat count
								reminder.limit--;
							}
						}
						// Delete the reminder (since we reached the repeat limit)
						else return reminderManager.delete(reminder._id);

					// Increment the timestamp
					reminderManager.edit(reminder._id, { timestamp: jt.parseTime(reminder.raw_time, { fromNow: true }) });
				}
				// Delete the reminder (since it's not set to repeat)
				else reminderManager.delete(reminder._id);

				/* - - - - - { Send the Reminder } - - - - - */
				// prettier-ignore
				guild.members.fetch(reminder.user_id).then(async guildMember => {
					if (!guildMember) return;

					let channel = null;
					if (reminder.channel_id) channel = await guild.channels.fetch(reminder.channel_id).catch(() => null);

					// prettier-ignore
					// Create the embed :: { REMINDER }
					let embed_reminder = new BetterEmbed({
						title: "⏰ Reminder",
						description: jt.choice(config.reminder.FUN_STYLES)
							.replace(/\$REMINDER\b/g, reminder.name)
							.replace(/\$REMINDER_CUT_OFF\b/g, reminder.name.slice(0, 4).trim())
							.replace(/\$USERNAME\b/g, guildMember?.displayName || guildMember?.username || guildMember?.user?.username),
						footer: `ID: ${reminder._id} ${reminder.repeat ? reminder.limit !== null ? `• Repeat: ${reminder.limit} more ${reminder.limit === 1 ? "time" : "times"}` : "• Repeat: ✅" : ""}`,
						timestamp: true
					});

					if (!channel) {
						let error = reminder.channel_id
							? `I couldn't send your reminder to the channel you have set, so here's your reminder!`
							: undefined;

						// Send the notification to the user's DMs
						return await guildMember.send({ content: error, embeds: [embed_reminder] });
					}

					let userHasPermission = channel
						? channel.permissionsFor(guildMember).has(PermissionFlagsBits.SendMessages)
						: false;

					let clientHasPermission = channel
						? channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
						: false;
					
					// Send the notification to the fetched channel
					if (userHasPermission && clientHasPermission) {
						return await channel.send({
							content: jt.choiceWeighted(config.reminder.PING_STYLES).text
								.replace("$USER", guildMember)
								.replace("$REMINDER", reminder.name),
							embeds: [embed_reminder]
						});
					} else {
						let error = channel && !userHasPermission && !clientHasPermission
							? `Either you or I don't have permission to send messages in ${channel}, so here's your reminder!`
							: undefined;

						// Send the notification to the user's DMs
						return await guildMember.send({ content: error, embeds: [embed_reminder] });
					}
				}).catch(err => {
					logger.error("Failed to send reminder", `id: '${reminder._id}' | guild: '${reminder.guild_id}' | user: '${reminder.user_id}'`, err)
				});
			}
		};

		// Set an interval for checking reminders
		if (config.reminder.INTERVAL_CHECK_ENABLED)
			setInterval(async () => {
				// Fetch every guild the client's currently in
				let oAuth2Guilds = await client.guilds.fetch();
				let guilds = await Promise.all(oAuth2Guilds.map(o => client.guilds.fetch(o.id)));

				// Check for user reminders in all of them
				for (let guild of guilds) checkRemindersInGuild(guild);
			}, jt.parseTime(config.reminder.INTERVAL));
	}
};
