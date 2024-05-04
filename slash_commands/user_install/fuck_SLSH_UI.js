const { Client, CommandInteraction } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

const config = { fuck: require("../../configs/config_fuck.json") };

/** @type {import("../../configs/typedefs").RawCommandExports} */
module.exports = {
	category: "USER_INSTALL",
	options: { hidden: true },

	commandData: {
		name: "fuck",
		description: "What the fuck do you want?",
		type: 1,
		integration_types: [0, 1],
		contexts: [0, 1, 2]
	},

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let specialReply_chance = jt.chance(5);
		let specialReply_used = false;
		let reply = "";

		if (specialReply_chance) {
			for (let special of config.fuck.replies_special) {
				// Check if the interaction was from a special user
				if (interaction.user.id === special.USER_ID) {
					// Set reply to the special reply made specifically for that user
					reply = jt.choice(special.REPLIES);
					specialReply_used = true;

					// End the for-loop
					break;
				}
			}

			// If no special reply was found, pick a general reply
			if (!reply) reply = jt.choice(config.fuck.REPLIES_GENERAL);
		} else {
			// Pick a general reply
			reply = jt.choice(config.fuck.REPLIES_GENERAL);
		}

		// Create the embed :: { FUCK }
		let embed_fuck = new BetterEmbed({
			context: { interaction },
			description: reply,
			author: specialReply_chance
				? { text: `Special reply: ${interaction.user.username}`, hyperlink: "https://youtu.be/dQw4w9WgXcQ" }
				: null,
			footer: specialReply_chance ? `there's only a 5% chance of this happening` : null,
			color: specialReply_used
				? "#FFCB47"
				: ["#F3DE8A", "#EB9486", "#161925", "#81F499", "#FFFFFF", "#6BF178", "#35A7FF", "#6B6C9E"]
		});

		// Reply to the interaction with the embed
		return await embed_fuck.send(interaction);
	}
};
