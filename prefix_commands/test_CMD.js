const { Client, PermissionFlagsBits, Message } = require("discord.js");
const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "poison",
	description: "Poison a member (timeout)",
    category: "Moderation",
    usage: "<user id>",

	options: {
		icon: "☠️",
		specialUserPerms: [PermissionFlagsBits.ModerateMembers],
		specialBotPerms: [PermissionFlagsBits.ModerateMembers]
	},

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		// Create an array of responses
		let choices = [
			"What's up, **$USERNAME**! Have a cookie! :cookie:",
			"Hey, **$USERNAME**! Have a glass of milk! :milk:"
		];

		// Create the embed :: { COOKIE }
		let embed_cookie = new BetterEmbed({
			author: { user: message.author },
			description: jt.choice(choices)
		});

		// Reply to the user with the embed
		return await embed_cookie.reply(message, { allowedMentions: { repliedUser: false } });
	}
};
