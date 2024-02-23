const { Client, PermissionFlagsBits, Message } = require("discord.js");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "kick",
	description: "Kick a user from the server",
	category: "Moderation",
	usage: "<user> --r <reason?>",

	options: {
		icon: "🥾",
		specialUserPerms: [PermissionFlagsBits.KickMembers],
		specialBotPerms: [PermissionFlagsBits.KickMembers]
	},

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message, { cleanContent }) => {
		// prettier-ignore
		// Check if the user provided any command args
		if (!cleanContent.trim()) return await message.reply({
            content: `You must provide a user to kick.`,
            allowedMentions: { repliedUser: false }
        });

		// Fetch the target user
		let targetUser = await message.guild.members.fetch(cleanContent.split(" ")[0].trim());
		// prettier-ignore
		if (!targetUser) return await message.reply({
            content: `Could not find user '${targetUser}'.`,
            allowedMentions: { repliedUser: false }
        });

		// Check if the user is kickable
		if (!targetUser.kickable || targetUser.roles.highest.position >= message.member.roles.highest.position)
			return await message.reply({
				content: `**${targetUser.user.username}** has plot armor and can not be kicked.`,
				allowedMentions: { repliedUser: false }
			});

		// Get the reason, if provided
		let reason = cleanContent.match(/--r (.*)/g);

		// Kick the user from the server
		await targetUser.kick(reason.length ? reason[0].replace("--r ", "") : "N/A").catch(async err => {
			// Log the error to the console
			console.error(err);

			// Send an error message
			return await message.reply({
				content: `Failed to kick user from the server.`,
				allowedMentions: { repliedUser: false }
			});
		});

		// Let the moderator know the user was kicked from the guild
		return await message.reply({
			content: `**${targetUser.user.username}** has been kicked from the server.`,
			allowedMentions: { repliedUser: false }
		});
	}
};
