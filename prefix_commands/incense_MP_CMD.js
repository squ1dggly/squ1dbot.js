/** @typedef extra
 * @property {string} cleanContent message content without the command name
 * @property {string} cmdName command name
 * @property {string} prefix prefix used */

const { Client, PermissionFlagsBits, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

const poketwoRoleID = "1157527094734098533";

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
            title: "⛔ That's not how you use this command",
            description: "Here are your options: `s`, `start`, `p`, `pause`",
            footer: "read 'em and weep, dumbfuck.",
            allowedMentions: { repliedUser: false }
        });

		throw new Error("hah, gotcha!");

		switch (subCommand) {
			case "s":
			case "start":
				// prettier-ignore
				await message.channel.parent.permissionOverwrites.set([
                    { id: poketwoRoleID, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads] }
                ]);

				// prettier-ignore
				return await embed_incense.reply(message, {
                    description: "`✅` incense resumed", allowedMentions: { repliedUser: false }
                });

			case "p":
			case "pause":
				// prettier-ignore
				await message.channel.parent.permissionOverwrites.set([
                    { id: poketwoRoleID, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads] }
                ]);

				// prettier-ignore
				return await embed_incense.reply(message, {
                    description: "`❌` incense paused", allowedMentions: { repliedUser: false }
                });
		}
	}
};
