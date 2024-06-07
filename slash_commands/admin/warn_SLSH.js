const { Client, PermissionFlagsBits, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const { guildManager } = require("../../utils/mongo");
const jt = require("../../utils/jsTools");

/** @type {import("../../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "Fun",

	options: {
		deferReply: true,
		specialUserPerms: [PermissionFlagsBits.ViewAuditLog]
	},

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("warn")
        .setDescription("Warn a user in the guild")
    
        .addUserOption(option => option.setName("user").setDescription("The user to warn").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("The reason for the warn")),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let user = interaction.options.getUser("user");
		let reason = interaction.options.getString("reason");

		// Warn the user
		await guildManager.user.warns.add(interaction.guild.id, user.id, reason);

		return await interaction.reply({ content: `test warned **${user.username}**` });
	}
};
