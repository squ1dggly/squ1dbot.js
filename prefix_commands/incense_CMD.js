/** @typedef options
 * @property {string} icon icon to show in the help command list
 * @property {boolean} botAdminOnly only allow bot staff to use this command
 * @property {boolean} guildAdminOnly only allow guild admins to use this command
 * @property {boolean} hidden hide this command from the help command list
 */

/** @typedef exports
 * @property {string} name name of the command
 * @property {string[]} aliases different ways this command can be called
 * @property {string} description description of the command
 * @property {string} usage how the command can be used
 * @property {options} options extra options for the command
 * @property {Function} execute executed when the command is used
 */

/** @typedef extra
 * @property {string} cleanContent message content without the command name
 * @property {string} cmdName command name
 * @property {string} prefix prefix used */

const { Client, PermissionFlagsBits, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");

/** @type {exports} */
module.exports = {
	name: "incense",
	aliases: ["inc"],
	description: "Pause or resume an ongoing Pokétwo incense",
	usage: "<start/s | pause/p>",
	options: { icon: "🕯️", guildAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {extra} extra */
	execute: async (client, message, { cleanContent, cmdName, prefix }) => {
		// Create the embed :: { INCENSE }
		let embed_incense = new BetterEmbed();

		/* - - - - - { Error Checking } - - - - - */
		// Fetch the poketwo bot
		let user_poketwo = await message.guild.members.fetch("716390085896962058");
		// prettier-ignore
		if (!user_poketwo) return await embed_incense.reply(message, {
            title: "⛔ Pokétwo not found",
            description: "How am I supposed to toggle an incense if Pokétwo's not even in the server, punk?",
            allowedMentions: { repliedUser: false }
        });

		// Check if we have permission to manage channels
		if (!message.channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.ManageChannels))
			return await embed_incense.reply(message, {
				title: "⛔ Missing Permissions",
				description: "I need the **`Manage Channels`** permission to do that.",
				footer: "i oonly have 8.9 million power :(",
				allowedMentions: { repliedUser: false }
			});

		let subCommand = cleanContent.split(" ")[0];
		// prettier-ignore
		if (!subCommand) return await embed_incense.reply(message, {
            title: "⛔ That's not how you use this command!",
            description: "Here are your options: `s`, `start`, `p`, `pause`",
            footer: "read 'em and weep, dumbfuck",
            allowedMentions: { repliedUser: false }
        });

		switch (subCommand) {
			case "s":
			case "start":
				// prettier-ignore
				await message.channel.parent.permissionOverwrites.edit(user_poketwo, {
                    SendMessages: true,
                    SendMessagesInThreads: true
                });

				// prettier-ignore
				return await embed_incense.reply(message, {
                    description: "`✅` incense has been resumed.", allowedMentions: { repliedUser: false }
                });

			case "p":
			case "pause":
				// prettier-ignore
				await message.channel.parent.permissionOverwrites.edit(user_poketwo, {
                    SendMessages: false,
                    SendMessagesInThreads: false
                });

				// prettier-ignore
				return await embed_incense.reply(message, {
                    description: "`❌` incense has been paused.", allowedMentions: { repliedUser: false }
                });
		}
	}
};
