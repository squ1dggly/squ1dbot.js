const { Client, Message } = require("discord.js");
const { BetterEmbed } = require("../modules/discordTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "ping",
	description: "Check my ping",

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
    execute: async (client, message) => {
        // Create the embed :: { PING }
		let embed_ping = new BetterEmbed({ description: `${client.ws.ping}ms` });

        // Send the embed
		return await embed_ping.reply(message, { allowedMentions: { repliedUser: false } });
	}
};
