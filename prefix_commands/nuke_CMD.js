const { Client, PermissionFlagsBits, Message } = require("discord.js");
const { BetterEmbed, awaitConfirm } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

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
			title: "Are you sure you want to do this?",
			description: `You are about to delete everything in ${message.channel}...`,
			deleteOnCancel: true,
			deleteOnConfirm: true
		});

		if (!confirmation) return;

		/* - - - - - { Nuke Channel } - - - - - */
		let messageTotal = 0;

		const nuke = async _messages => {
			if (_messages && !_messages.size) return;

			_messages = message.channel.messages.fetch({ limit: 1000 });
			if (!_messages.size) return;

			messageTotal += _messages.size;

			// Delete
			await Promise.all(_messages.map(async m => m.delete().catch(() => null)));

			return await nuke(_messages);
		};

		await nuke();

		// Let the user know the result
		let embed_nuke = new BetterEmbed({
			channel: message.channel,
			title: "Nuke",
			description: `${messageTotal} messages have been deleted from ${message.channel}!`
		});

		return await embed_nuke.send({ deleteAfter: "5s" });
	}
};
