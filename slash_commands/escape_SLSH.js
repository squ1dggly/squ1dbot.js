const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools/_dsT");
const _jsT = require("../modules/jsTools/_jsT");

const config = { escape: require("../configs/config_escape.json") };

module.exports = {
	options: { icon: "🌴", deferReply: false },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("escape")
        .setDescription("An escape for when Med's tired of our bullshit"),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// prettier-ignore
		if (interaction.user.id !== "396906362916831233") return await interaction.reply({
			content: _jsT.choice(config.escape.ERROR), ephemeral: true
		});

		let embed_escape = new BetterEmbed({
			interaction,
			title: "Medaka's Escape",
			description: _jsT.chance(69) ? _jsT.choice(config.escape.BAD) : _jsT.choice(config.escape.GOOD)
		});

		return await embed_escape.send({ ephemeral: true });
	}
};
