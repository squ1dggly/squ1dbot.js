const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

/** @type {import("../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "Staff",
	options: { icon: "⚙️", deferReply: true, botAdminOnly: true },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("set-avatar")
        .setDescription("Set the bot's avatar")
    
        .addAttachmentOption(option => option.setName("image").setDescription("Image to set as the bot's avatar")
            .setRequired(true)
        ),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let avatar = interaction.options.getAttachment("image");

		await client.user.setAvatar(avatar.url).catch(async err => {
			console.error("Could not set client avatar", err);

			return await interaction.editReply({
				content: "Invalid avatar! Please use something that's not stupid like you."
			});
		});

		return await interaction.editReply({ content: "Avatar set!" });
	}
};
