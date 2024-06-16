const { Client, CommandInteraction } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

/** @type {import("../../configs/typedefs").RawCommandExports} */
module.exports = {
	category: "USER_INSTALL",
	options: { hidden: true },

	commandData: {
		name: "random",
		description: "Random fun things I guess",
		type: 1,
		integration_types: [0, 1],
		context: [0, 1, 2]
	},

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		console.log(interaction);

		return await interaction.reply({ content: "This command is not yet implemented.", ephemeral: true });
	}
};
