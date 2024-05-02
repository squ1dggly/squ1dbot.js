const { Client, CommandInteraction } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

const config = { escape: require("../../configs/config_escape.json") };

/** @type {import("../../configs/typedefs").RawCommandExports} */
module.exports = {
	category: "USER_INSTALL",
	options: { hidden: true },

	commandData: {
		name: "escape",
		description: "An escape for when Med's tired of our bullshit",
		type: 1,
		integration_types: [0, 1],
		context: [0, 1, 2]
	},

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// prettier-ignore
		// Check if the interaction was from the user Medaka
		if (interaction.user.id !== "396906362916831233") return await interaction.reply({
			content: jt.choice(config.escape.ERROR)
		});

		// Create the embed :: { ESCAPE }
		let embed_escape = new BetterEmbed({
			title: "Medaka's Escape",
			description: jt.chance(69) ? jt.choice(config.escape.BAD) : jt.choice(config.escape.GOOD)
		});

		// Reply to the interaction with the embed
		return await embed_escape.send(interaction);
	}
};
