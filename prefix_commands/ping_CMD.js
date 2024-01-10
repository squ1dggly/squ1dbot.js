const { Client, Message } = require("discord.js");
const { ping } = require("../modules/mongo");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "ping",
	description: "Check my ping",

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		let responsePing = Date.now() - message.createdTimestamp;
		let databasePing = await ping();

		// Send the client's ping
		return await message.reply({
			content: `Client: **${client.ws.ping}ms**, Response: **${responsePing}ms**, Database: **${databasePing}ms**`,
			allowedMentions: { repliedUser: false }
		});
	}
};
