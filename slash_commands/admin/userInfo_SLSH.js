const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { BetterEmbed, EmbedNavigator } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

/** @type {import("../../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "Admin",

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("userinfo")
        .setDescription("View info about a user in the guild")

        .addUserOption(option => option.setName("user").setDescription("The user to view info about").setRequired(false)),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let member = interaction.options.getMember("user") || interaction.member;

		/* - - - - - { Info Embed } - - - - - */
		let embed_info = new BetterEmbed({
			context: { interaction },
			author: { text: `User Info - ${member.user.username}`, icon: true },
			thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

			description: "something useful's supposed to go here..."
		});

		/* - - - - - { Warns Embed } - - - - - */
		let embed_warns = new BetterEmbed({
			context: { interaction },
			author: { text: `User Warns - ${member.user.username}`, icon: true },
			thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

			description: "something useful's supposed to go here..."
		});

		/* - - - - - { Details Embed } - - - - - */
		let embed_details = new BetterEmbed({
			context: { interaction },
			author: { text: `User Details - ${member.user.username}`, icon: true },
			thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

			description: "something useful's supposed to go here..."
		});

		/* - - - - - { Paginate } - - - - - */
		let embedNav = new EmbedNavigator({
			embeds: [embed_info, embed_warns, embed_details],
			userAccess: interaction.user,
			selectMenuEnabled: true
		});

		// Populate the select menu
		embedNav.addSelectMenuOptions(
			{ emoji: "📑", label: "Info" },
			{ emoji: "⚠️", label: "Warns" },
			{ emoji: "📜", label: "Details" }
		);

		// Send the embeds with pagination
		return await embedNav.send(interaction);
	}
};
