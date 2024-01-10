const { Client, Message } = require("discord.js");
const { BetterEmbed } = require("../modules/discordTools");
const { guildManager } = require("../modules/mongo");
const jt = require("../modules/jsTools");

const config = { client: require("../configs/config_client.json") };

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "prefix",
	description: "View/set the prefix",
	category: "Admin",

	usage: "<prefix?>",
	options: { guildAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message, { cleanContent }) => {
		if (!cleanContent) {
			// Fetch the current prefix for the guild
			let prefix = (await guildManager.fetchPrefix(message.guild.id)) || config.client.PREFIX;

			// Let the user know the result
			return await message.reply({
				content: `My prefix is \`${prefix}\`!`,
				allowedMentions: { repliedUsers: false }
			});
		}

		// Set the guild's prefix
		await guildManager.setPrefix(message.guild.id, cleanContent);

		// Let the user know the result
		return await message.reply({
			content: `Prefix changed to \`${cleanContent}\`.`,
			allowedMentions: { repliedUsers: false }
		});
	}
};
