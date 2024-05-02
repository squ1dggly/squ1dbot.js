const { Client, Message, User, GuildMember } = require("discord.js");
const { BetterEmbed, BetterEmbed } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "test",
	description: "Dev testing command",
	category: "Fun",

	options: { botAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		let embed = new BetterEmbed({
			context: { message },
			author: { text: "Test Embed", icon: "$BOT_AVATAR" },
			title: { text: "Test Title", hyperlink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
			description: "This is an embed. I am also, as of $YEAR, gay.",
			footer: { text: "this is the footer.", icon: "$USER_AVATAR" },
			thumbnailURL: "$USER_AVATAR",
			imageURL:
				"https://media.discordapp.net/attachments/983469348108771388/1171307431293362227/dad.gif?ex=66273b0d&is=6614c60d&hm=283292d66f0c1375569d69ab6e8801c2adba691ed07079934038127a542b22fe&",
			color: ["Red", "White", "Blue"],
			fields: [
				{ name: "$year/$month/$day", value: "date moment" },
				{ name: "$MONTH/$DAY/$YEAR", value: "date moment (americanized)" },
				{ name: "$DISPLAY_NAME", value: "$USER_NAME" }
			],
			timestamp: true
		});

		console.log(embed.data);

		return await embed.send(message, { allowedMentions: { repliedUser: false } });
	}
};
