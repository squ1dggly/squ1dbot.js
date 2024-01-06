/** @typedef extra
 * @property {string} cleanContent message content without the command name
 * @property {string} cmdName command name
 * @property {string} prefix prefix used */

const { Client, PermissionFlagsBits, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

module.exports = {
	name: "incense",
	aliases: [],
	description: "Pause or resume an ongoing Pokétwo incense",
	options: { icon: "🌽", guildAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {extra} extra */
	execute: async (client, message, { cleanContent, cmdName, prefix }) => {
		// Create the embed :: { INCENSE }
		let embed_incense = new BetterEmbed();

		let subCommand = cleanContent.split(" ")[0];
		// prettier-ignore
		if (!subCommand) return await embed_incense.reply(message, {
            title: "⛔ That's not how you use this command!",
            description: "Here are your options: `s`, `start`, `p`, `pause`",
            footer: "read 'em and weep, dumbfuck",
            allowedMentions: { repliedUser: false }
        });

        // Fetch the poketwo bot
        let user_poketwo = await message.guild.members.fetch("716390085896962058");

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
