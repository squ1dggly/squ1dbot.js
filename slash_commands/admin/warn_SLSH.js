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
        .addStringOption(option => option.setName("reason").setDescription("The reason for the warn (default: N/A)"))
        .addStringOption(option => option.setName("severity").setDescription("The severity of the warn (default: 🟡 Low)")
            .addChoices(
                { name: "🟡 Low", value: "low" },
                { name: "🟠 Medium", value: "medium" },
                { name: "🔴 High", value: "high" }
            )    
        ),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let user = interaction.options.getUser("user");
		let reason = interaction.options.getString("reason") || "N/A";
		let severity = interaction.options.getString("severity") || "low";

		// Convert severity into the corresponding emoji
		let severity_f = "";

		switch (severity) {
			case "low":
				severity_f = "🟡";
				break;
			case "medium":
				severity_f = "🟠";
				break;
			case "high":
				severity_f = "🔴";
				break;
		}

		// Warn the user
		let warn = await guildManager.user.warns.add(interaction.guild.id, user.id, reason, severity_f);

		// prettier-ignore
		// Create the embed :: { WARN }
		let embed_warn = new BetterEmbed({
			color: "Orange",
            title: `**${user.username}** Warned`,
            thumbnailURL: user.displayAvatarURL(),
			description: `\nUser ID: \`${user.id}\``,
            footer: `ID: ${warn.id}`,
            
            fields: [
                { name: "Reason:", value: `"${warn.reason}"`, inline: true },
                { name: "Severity:", value: `\`${warn.severity} ${jt.toTitleCase(severity)}\``, inline: true },
            ]
		});

		// Send the embed
		return await embed_warn.send(interaction, {
			content: `\`⚠️\` ${user} has been warned by **${interaction.member.displayName}**!`
		});
	}
};
