const { Client, Message, User, GuildMember } = require("discord.js");
const { BetterEmbed } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "test",
	description: "Dev testing command",
	category: "Fun",

	options: { botAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		let guildMember = message.member;
		let user = message.author;

		console.log(`User: ${user instanceof User} | GuildMember: ${guildMember instanceof GuildMember}`);
	}
};
