const { Client, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder, GuildMember } = require("discord.js");
const { BetterEmbed, EmbedNavigator } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };

/** @param {GuildMember} guildMember */
function getKeyPermissions(guildMember) {
	const keyPermissions = [
		{ key: "Administrator", value: "Admin" },
		{ key: "ManageMessages", value: "Messages" },
		{ key: "ManageChannels", value: "Channels" },
		{ key: "ManageGuild", value: "Guild" },
		{ key: "ManageRoles", value: "Roles" },
		{ key: "BanMembers", value: "Ban" },
		{ key: "KickMembers", value: "Kick" },
		{ key: "MentionEveryone", value: "Mention Everyone" }
	];

	// Get the permissions of the member
	let member_permissions = guildMember.permissions.toArray();

	// Filter out permissions that are not in the keyPermissions array
	let member_keyPerms = member_permissions
		.map(p => {
			let idx = keyPermissions.findIndex(kp => kp.key === p);

			if (idx >= 0) return `\`${keyPermissions[idx].value}\``;
		})
		// Filter out empty values
		.filter(p => p);

	// Return the alphabetically sorted permissions array
	return member_keyPerms.sort((a, b) => a.localeCompare(b));
}

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
		let member_keyPerms = getKeyPermissions(member);
		let member_properties = [];

		if (member.id === interaction.guild.ownerId) member_properties.push("`👑 SERVER OWNER`");
		if (member.permissions.has(PermissionFlagsBits.Administrator)) member_properties.push("`🛠️ ADMIN`");
		if (member.user.bot) member_properties.push("`🤖 BOT`");
		if ([config.client.OWNER_ID, ...config.client.ADMIN_IDS].includes(member.id)) member_properties.push("`🔥 BOT DEV`");

		let embed_info = new BetterEmbed({
			context: { interaction },
			/* author: {
				text: `User Info - ${member.user.username} ${member.id === interaction.guild.ownerId ? "(👑)" : ""}`,
				icon: true
			}, */
			// title: `${member.id === interaction.guild.ownerId ? "👑" : ""} User Info - ${member.user.username}`,
			title: `User Info | ${member.user.username}`,
			thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),
			// footer: { text: `ID: ${member.id}` },

			description: member_properties.length ? member_properties.join(" ") : "",
			timestamp: true,

			/* description:
				"- **Account**\n - Created: $USER_CREATED\n - Bot: $IS_BOT\n\n- **Server**\n - Joined: $JOINED_GUILD\n - Owner: $IS_OWNER\n - Admin: $IS_ADMIN"
					.replace("$USER_CREATED", `<t:${jt.msToSec(member.user.createdTimestamp)}:R>`)
					.replace("$IS_BOT", member.user.bot ? "`✅`" : "`❌`")
					.replace("$JOINED_GUILD", `<t:${jt.msToSec(member.joinedTimestamp)}:R>`)
					.replace("$IS_OWNER", member.id === interaction.guild.ownerId ? "`👑`" : "`❌`")
					.replace("$IS_ADMIN", member.permissions.has(PermissionFlagsBits.Administrator) ? "`✅`" : "`❌`"), */

			fields: [
				{
					name: "Avatar",
					value: "[128px]($128>) - [256px]($256) - [512px]($512) - [1024px]($1024)"
						.replace("$128", member.user.displayAvatarURL({ size: 128 }))
						.replace("$256", member.user.displayAvatarURL({ size: 256 }))
						.replace("$512", member.user.displayAvatarURL({ size: 512 }))
						.replace("$1024", member.user.displayAvatarURL({ size: 1024 }))
				},

				{
					name: "Account",
					value: "- Created: $USER_CREATED\n- User: `$USER_NAME`\n- ID: `$USER_ID`"
						.replace("$USER_CREATED", `<t:${jt.msToSec(member.user.createdTimestamp)}:R>`)
						.replace("$USER_NAME", member.user.username)
						.replace("$USER_ID", member.id),
					inline: true
				},

				{
					name: "Server",
					value: "- Joined: $JOINED_GUILD\n- Mention: $USER_MENTION\n- Warns: `$WARN_COUNT`"
						.replace("$JOINED_GUILD", `<t:${jt.msToSec(member.joinedTimestamp)}:R>`)
						.replace("$USER_MENTION", `${member}`)
						.replace("$WARN_COUNT", "0"),
					inline: true
				},

				{
					name: `Key Permissions (${member_keyPerms.length})`,
					value: member_keyPerms.length ? member_keyPerms.join(", ") : "`None`"
				}
			]

			/* fields: [
				{
					name: "Avatar",
					value: "[128px]($128>) - [256px]($256) - [512px]($512) - [1024px]($1024)"
						.replace("$128", member.user.displayAvatarURL({ size: 128 }))
						.replace("$256", member.user.displayAvatarURL({ size: 256 }))
						.replace("$512", member.user.displayAvatarURL({ size: 512 }))
						.replace("$1024", member.user.displayAvatarURL({ size: 1024 }))
				},

				{ name: "Account Created", value: `<t:${jt.msToSec(member.user.createdTimestamp)}:R>`, inline: true },
				{ name: "Bot", value: member.user.bot ? "✅" : "❌", inline: true },

				{ name: "Joined Guild", value: `<t:${jt.msToSec(member.joinedTimestamp)}:R>` },
				{
					name: "Admin",
					value: member.permissions.has(PermissionFlagsBits.Administrator) ? "✅" : "❌",
					inline: true
				}
			] */
		});

		/* - - - - - { Details Embed } - - - - - */
		let embed_details = new BetterEmbed({
			context: { interaction },
			author: {
				text: `${member.id === interaction.guild.ownerId ? "👑" : ""} User Info - ${member.user.username}`,
				icon: true
			},
			thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

			description: "something useful's supposed to go here..."
		});

		/* - - - - - { Warns Embed } - - - - - */
		let embed_warns = new BetterEmbed({
			context: { interaction },
			author: {
				text: `${member.id === interaction.guild.ownerId ? "👑" : ""} User Info - ${member.user.username}`,
				icon: true
			},
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
			{ /* emoji: "📑", */ label: "At a Glance" },
			{ /* emoji: "📜", */ label: "Detailed View" },
			{ /* emoji: "⚠️", */ label: "Warns" }
		);

		// Send the embeds with pagination
		return await embedNav.send(interaction);
	}
};
