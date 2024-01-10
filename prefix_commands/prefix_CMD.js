const { Client, Message } = require("discord.js");
const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "prefix",
	description: "View/set the prefix",
	category: "Admin",

	usage: "<prefix?>",
	options: { guildAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message, { cleanContent }) => {
        let args = cleanContent;
	}
};
