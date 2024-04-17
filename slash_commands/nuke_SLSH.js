const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { BetterEmbedV2, awaitConfirm } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

/** @type {import("../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "Admin",
	options: { deferReply: true, icon: "💣" },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("nuke")
        .setDescription("Delete all the messages in a channel.")
        .addChannelOption(option => option.setName("channel").setDescription("The channel to nuke.")),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let channel = interaction.options.getChannel("channel") || interaction.channel;

		const fetchMessages = async (lastMessage = null, currentMessages = null) => {
			let _messages = await channel.messages.fetch({
				limit: 100,
				before: lastMessage?.id || null
			});

			if (!_messages.size) return currentMessages;

			// Merge collections
			if (currentMessages)
				currentMessages = currentMessages.merge(
					_messages,
					x => ({ keep: true, value: x }),
					y => ({ keep: true, value: y })
				);
			else currentMessages = _messages;

			// Run it back
			return await fetchMessages(_messages.last(), currentMessages);
		};

		// Let the user know we're fetching messages
		await interaction.editReply({ content: "`⏳` Getting channel messages. This might take a second..." });

		// Get the all the messages in the channel
		let messages = await fetchMessages();

		// Remove the message content
		await interaction
			.editReply({
				content: "If you ask me, I think you should just delete the whole server. 🤷"
			})
			.catch(() => null);

		// Make sure the user actually wants to do this
		let confirmation = await awaitConfirm({
			interaction,
			color: "Red",
			title: "Carefully review your decision...",
			description: `You are about to delete ***EVERY MESSAGE*** (${messages.size} of 'em) from ${channel}...`,
			deleteOnCancel: true,
			deleteOnConfirm: true
		});

		if (!confirmation) return;

		// Delete the messages
		await Promise.all(jt.chunk(Array.from(messages.values()), 100).map(chunk => channel.bulkDelete(chunk)));

		/* - - - - - { Send the Success Embed } - - - - - */
		let embed_nuke = new BetterEmbedV2({
			title: "Nuke Complete",
			description: `Deleted ${messages.size} messages from ${channel}.`
		});

		// Send the embed
		return await embed_nuke.send(interaction.channel, { deleteAfter: "7s" });
	}
};
