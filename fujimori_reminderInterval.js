const { Client, Events } = require("discord.js");
const { BetterEmbed } = require("../../../utils/discordTools");
const { userManager } = require("../../../utils/mongo");
const jt = require("../../../utils/jsTools");

const INTERVAL_CHECK_ENABLED = true;
const INTERVAL = "10s";

module.exports = {
	name: "reminderInterval",
	event: Events.ClientReady,

	execute: async client => {
		const checkRemindersInGuild = async () => {
			// Fetch the active reminders in the guild
			let reminders = await userManager.reminders.fetchActiveInGuild(guild.id);
			if (!reminders.length) return;

			for (let reminder of reminders) {
				// Delete the reminder (since it's not repeating, and I'm not paid enough to add repeating reminders)
				reminderManager.delete(reminder._id);

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
                        description: `Your dad's a hoe, and your **${jt.toTitleCase(reminder.type)}**'s ready you fucking cunt.`,
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
						return await channel.send({ embeds: [embed_reminder] });
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
		if (INTERVAL_CHECK_ENABLED)
			setInterval(async () => {
				// Fetch every guild the client's currently in
				let oAuth2Guilds = await client.guilds.fetch();
				let guilds = await Promise.all(oAuth2Guilds.map(o => client.guilds.fetch(o.id)));

				// Check for user reminders in all of them
				for (let guild of guilds) checkRemindersInGuild(guild);
			}, jt.parseTime(INTERVAL));
	}
};
