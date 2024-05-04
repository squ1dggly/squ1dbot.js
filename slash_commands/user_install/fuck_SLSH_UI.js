const { Client, CommandInteraction } = require("discord.js");
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
		return await interaction.reply({ content: jt.choice(choices) });
	}
};
