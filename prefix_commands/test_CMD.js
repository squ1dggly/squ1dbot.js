const { Client, Message, User, GuildMember } = require("discord.js");
const { BetterEmbed, BetterEmbedV2 } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "test",
	description: "Dev testing command",
	category: "Fun",

	options: { botAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		let embed = new BetterEmbedV2({
			context: { message },
			author: { text: "Test Embed", icon: true },
			description: "This is an embed. I am also, as of $YEAR, gay.",
			fields: { name: "$year/$month/$day", value: "date moment" }
		});

		console.log(embed.data);

		return await embed.send(message);
	}
};
