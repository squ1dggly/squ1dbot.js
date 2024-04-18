const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { BetterEmbedV2 } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

const config = { escape: require("../../configs/config_escape.json") };

/** @type {import("../../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "SPECIAL",
	options: { icon: "🌴", hidden: true },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("escape")
        .setDescription("An escape for when Med's tired of our bullshit"),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// prettier-ignore
		if (interaction.user.id !== "396906362916831233") return await interaction.reply({
			content: jt.choice(config.escape.ERROR)
		});

		let embed_escape = new BetterEmbedV2({
			title: "Medaka's Escape",
			description: jt.chance(69) ? jt.choice(config.escape.BAD) : jt.choice(config.escape.GOOD)
		});

		return await embed_escape.send(interaction);
	}
};
