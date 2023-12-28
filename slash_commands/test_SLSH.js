const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

module.exports = {
	// prettier-ignore
	builder: new SlashCommandBuilder().setName("test")
        .setDescription("Test dev stuff")

        .addStringOption(option => option.setName("message").setDescription("yes").setRequired(true)),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let message = await interaction.channel.messages.fetch(interaction.options.getString("message"));
		console.log(message);
	}
};
