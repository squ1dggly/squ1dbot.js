const { Client, PermissionFlagsBits, Message } = require("discord.js");
const { BetterEmbed, awaitConfirm } = require("../utils/discordTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "nuke",
	description: "Nuke a channel (delete all messages)",
	category: "Admin",

	options: {
		icon: "💣",
		specialUserPerms: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
		specialBotPerms: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
	},

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		let confirmation = await awaitConfirm({
			color: "Red",
			channel: message.channel,
			user: message.author,
			title: "Are you sure you want to do this?",
			description: `You are about to delete everything in ${message.channel}...`,
			deleteOnCancel: true,
			deleteOnConfirm: true
		});

		if (!confirmation) return;

		let progressEmoji = "⏳";

		// Send a progress message
		let msg_progress = await message.channel.send({
			content: `${progressEmoji} Nuking channel... This might take a minute you cunt.`
		});

		/* - - - - - { Nuke Channel } - - - - - */
		let messageTotal = 0;

		const nuke = async _messages => {
			if (_messages && !_messages.size) return;

			_messages = await message.channel.messages.fetch({ limit: 100 });
			if (!_messages.size) return;

			// Filter out the progress message
			_messages = _messages.filter(m => m.id !== msg_progress.id);

			messageTotal += _messages.size;

			// Delete
			// await Promise.all(_messages.map(m => m.delete().catch(() => null)));
			await message.channel.bulkDelete(_messages);

			/// Update the progress message
			if (progressEmoji === "⏳") progressEmoji = "⌛";
			else progressEmoji = "⏳";

			// prettier-ignore
			if (msg_progress.editable) msg_progress.edit({
                content: `${progressEmoji} Nuking channel... This might take a minute you cunt.\n${messageTotal} has been deleted so far.`
            });

			// Run it back
			return await nuke(_messages);
		};

		// Nuke the channel
		await nuke();

		// Delete the progress message
		if (msg_progress.deletable) await msg_progress.delete().catch(() => null);

		// prettier-ignore
		// Let the user know the result
		let embed_nuke = new BetterEmbed({
			channel: message.channel,
			title: "Nuke",
			description: `${messageTotal} ${messageTotal === 1 ? "Message has" : "Messages have"} been deleted from ${message.channel}!`
		});

		return await embed_nuke.send({ deleteAfter: "5s" });
	}
};
