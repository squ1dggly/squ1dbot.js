const { Client, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder, GuildMember } = require("discord.js");
const { BetterEmbed, EmbedNavigator } = require("../../utils/discordTools");
const { guildManager, userManager } = require("../../utils/mongo");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };
const WANTED_THRESHOLD = 5;
const MAX_WARNS_PER_PAGE = 3;

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
	options: { deferReply: true },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("userinfo")
        .setDescription("View info about a user in the guild")

        .addUserOption(option => option.setName("user").setDescription("The user to view info about").setRequired(false)),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let member = interaction.options.getMember("user") || interaction.member;
		let user = await client.users.fetch(member.id, { force: true });

		/* - - - - - { Info Embed } - - - - - */
		let member_warns = await guildManager.user.warns.fetchAll(interaction.guild.id, member.id);
		let user_biography = (await userManager._fetch(member.id, { biography: 1 }))?.biography || null;

		let member_keyPerms = getKeyPermissions(member);
		let member_roles = Array.from(member.roles.cache.sort((a, b) => b.position - a.position).values());
		// Strip @everyone role
		member_roles.pop();

		let member_properties = [];

		// Is guild owner
		if (member.id === interaction.guild.ownerId) member_properties.push("`👑 SERVER OWNER`");
		// Has admin permission in the current guild
		if (member.permissions.has(PermissionFlagsBits.Administrator)) member_properties.push("`🛠️ ADMIN`");
		// User's account is a bot
		if (member.user.bot) member_properties.push("`🤖 BOT`");
		// User is a squ1dbot admin/developer
		if ([config.client.OWNER_ID, ...config.client.ADMIN_IDS].includes(member.id)) member_properties.push("`🔥 BOT DEV`");
		// User has been warned past a certain threshold
		if (member_warns.length > WANTED_THRESHOLD) member_properties.push("`⚠️ WANTED`");

		let embed_info = new BetterEmbed({
			context: { interaction },
			title: `User Info | ${member.user.username}`,
			thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

			description: "$MEMBER_PROPS $USER_BIO"
				.replace("$MEMBER_PROPS", member_properties.length ? member_properties.join(" ") : "")
				.replace("$USER_BIO", user_biography ? `\n> ${user_biography}` : ""),
			imageURL: user.bannerURL({ size: 1024 }),
			color: user.banner ? user.hexAccentColor : "#2B2D31",

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
					value: "- Created: $USER_CREATED\n- Name: `$USER_NAME`\n- ID: `$USER_ID`"
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
						.replace("$WARN_COUNT", `${member_warns.length || "None"}`),
					inline: true
				}
			]
		});

		// prettier-ignore
		// Add the key permissions field, if any
		if (member_keyPerms.length) embed_info.addFields({
			name: `Key Permissions (${member_keyPerms.length})`,
			value: member_keyPerms.join(", ")
		});

		// Add the latest warning overview field, if it exists
		if (member_warns.length) {
			let _lastWarn = member_warns[member_warns.length - 1];

			embed_info.addFields({
				name: "⚠️ Latest Warning",
				value: '`$ID` `$SEVERITY` $TIMESTAMP - Reason: "$REASON"'
					.replace("$ID", _lastWarn.id)
					.replace("$SEVERITY", _lastWarn.severity)
					.replace("$TIMESTAMP", `<t:${jt.msToSec(_lastWarn.timestamp)}:R>`)
					.replace("$REASON", _lastWarn.reason)
			});
		}

		/* - - - - - { Details Embed } - - - - - */
		let embed_details = new BetterEmbed({
			context: { interaction },
			title: `User Details | ${member.user.username}`,
			thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

			description: "**Highest Role**: $ROLE_HIGHEST\n**Role Count**: $ROLE_COUNT"
				.replace("$ROLE_HIGHEST", member_roles[0])
				.replace("$ROLE_COUNT", member_roles.length)
		});

		/* - - - - - { Warns Embed } - - - - - */
		let embeds_warns = [];

		if (member_warns.length) {
			// Split warns per page
			let warns_split = jt.chunk(member_warns, MAX_WARNS_PER_PAGE);

			for (let i = 0; i < warns_split.length; i++) {
				// Format each warn into something readable
				let _warns = warns_split[i].map(w =>
					'`$ID` `$SEVERITY` $TIMESTAMP - Reason: "$REASON"'
						.replace("$ID", w.id)
						.replace("$SEVERITY", w.severity)
						.replace("$TIMESTAMP", `<t:${jt.msToSec(w.timestamp)}:R>`)
						.replace("$REASON", w.reason)
				);

				// Create the embed :: { WARNS }
				let _embed = new BetterEmbed({
					context: { interaction },
					title: `User Warns | ${member.user.username}`,
					thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

					description: _warns.join("\n"),
					footer: `Page ${i + 1}/${warns_split.length}`
				});

				// Push the page to the embed array
				embeds_warns.push(_embed);
			}
		} else {
			// Create the embed :: { NO WARNS }
			let embed_noWarns = new BetterEmbed({
				context: { interaction },
				title: `User Warns | ${member.user.username}`,
				thumbnailURL: member.user.displayAvatarURL({ dynamic: true }),

				description: `**${member.displayName}** hasn't been warned yet.`,
				footer: jt.chance(5) ? "i encourage someone to change that" : ""
			});

			// Push the page to the embed array
			embeds_warns.push(embed_noWarns);
		}

		/* - - - - - { Paginate } - - - - - */
		let embedNav = new EmbedNavigator({
			// embeds: [embed_info, embed_details, embeds_warns],
			embeds: [embed_info, embeds_warns],
			userAccess: interaction.user,
			pagination: { type: "short" },
			selectMenuEnabled: true
		});

		// Populate the select menu
		embedNav.addSelectMenuOptions(
			{ /* emoji: "📑", */ label: "At a Glance" },
			// { /* emoji: "📜", */ label: "Detailed View" },
			{ /* emoji: "⚠️", */ label: "Warns" }
		);

		// Send the embeds with pagination
		return await embedNav.send(interaction);
	}
};
