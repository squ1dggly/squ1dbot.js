/** @file Execute commands requested by a user message @author xsqu1znt */

const {
	Client,
	PermissionsBitField,
	Message,
	userMention,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	GuildMember
} = require("discord.js");
const { BetterEmbed, markdown } = require("../../../modules/discordTools");
const { guildManager } = require("../../../modules/mongo");
const logger = require("../../../modules/logger");
const jt = require("../../../modules/jsTools");

const config = {
	client: require("../../../configs/config_client.json"),
	bot: require("../../../configs/config_bot.json")
};

function userIsBotAdminOrBypass(message, commandName) {
	return [
		config.client.OWNER_ID,
		...config.client.ADMIN_IDS,
		...(config.client.admin_bypass_ids[commandName] || [])
	].includes(message.author.id);
}

function userIsGuildAdminOrBypass(message, commandName) {
	let isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
	let canBypass = userIsBotAdminOrBypass(message, commandName);

	return isAdmin || canBypass;
}

/** @param {GuildMember} member */
function hasSpecialPermissions(member, permissions) {
	let has = [];
	let missing = [];

	for (let permission of permissions) {
		if (member.permissions.has(permission)) has.push(permission);
		else missing.push(markdown.permissionFlagName(permission));
	}

	return { has, missing, passed: has.length === permissions.length };
}

module.exports = {
	name: "processPrefixCommand",
	event: "message_create",

	/** @param {Client} client @param {{message:Message}} args */
	execute: async (client, args) => {
		// Filter out non-guild, non-user, and non-command messages
		if (!args.message?.guild || !args.message?.author || args.message?.author?.bot || !args.message?.content) return;

		// prettier-ignore
		// Check if we have permission to send messages in this channel
		if (!args.message.guild.members.me.permissionsIn(args.message.channel).has(PermissionsBitField.Flags.SendMessages)) return;

		/* - - - - - { Check for Prefix } - - - - - */
		let prefix = (await guildManager.fetchPrefix(args.message.guild.id)) || null;

		// Check if the message started with the prefix
		let prefixWasUsed = args.message.content.toLowerCase().startsWith(prefix);

		// If that failed, check if the message started with a mention to the client
		if (!prefixWasUsed) {
			prefixWasUsed = args.message.content.startsWith(`${userMention(client.user.id)} `);
			// Change the prefix to the client mention
			prefix = `${userMention(client.user.id)} `;

			// Return if no valid prefixes were used
			if (!prefixWasUsed) return;
		}

		/* - - - - - { Parse the Message } - - - - - */
		let cleanContent = args.message.content.replace(prefix, "");
		let commandName = cleanContent.split(" ")[0];
		if (!commandName) return;

		cleanContent = cleanContent.replace(commandName, "").trim();

		// Get the prefix command function from the client, if it exists
		let prefixCommand = client.prefixCommands.get(commandName) || null;
		if (!prefixCommand) return;

		/* - - - - - { Parse Prefix Command } - - - - - */
		try {
			// Check for command options
			if (prefixCommand?.options) {
				let _botAdminOnly = prefixCommand.options?.botAdminOnly || null;
				let _guildAdminOnly = prefixCommand.options?.guildAdminOnly || null;
				let userPermissions = prefixCommand.options?.userPermissions || null;
				let botPermissions = prefixCommand.options?.botPermissions || null;
				userPermissions &&= jt.isArray(userPermissions);
				botPermissions &&= jt.isArray(botPermissions);

				// prettier-ignore
				// Check if the command requires the user to be an admin for the bot
				if (_botAdminOnly && !userIsBotAdminOrBypass(args.message, commandName)) return await args.message.reply({
					content: `Only the developers of ${client.user} can use that command.`
				});

				// prettier-ignore
				// Check if the command requires the user to have admin permission in the current guild
				if (_guildAdminOnly && !userIsGuildAdminOrBypass(args.message, commandName)) return await args.message.reply({
					content: "You need admin to use that command."
				});

				// Check if the user has the required permissions
				let _userPermissions = hasSpecialPermissions(args.message.member, userPermissions);
				// prettier-ignore
				if (userPermissions && !_userPermissions.passed) return await args.message.reply({
					content: `You're missing the required permissions to use this command:\n$PERMISSIONS`
						.replace("$PERMISSIONS", _userPermissions.missing.join(", "))
				});
			}

			/* - - - - - { Execute } - - - - - */
			let _args = { cleanContent, cmdName: commandName, prefix };

			// prettier-ignore
			return await prefixCommand.execute(client, args.message, _args).then(async message => {
				// TODO: run code here after the command is finished
			});
		} catch (err) {
			// Create a button :: { SUPPORT SERVER }
			let btn_supportServer = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL(config.bot.support.server.INVITE)
				.setLabel("Support Server");

			// Create an action row :: { SUPPORT SERVER }
			let aR_supportServer = new ActionRowBuilder().setComponents(btn_supportServer);

			// Create the embed :: { FATAL ERROR }
			let embed_fatalError = new BetterEmbed({
				title: "⛔ Ruh-roh raggy!",
				description: `An error occurred while running the **\`${commandName}\`** command.\nYou should probably report this unfortunate occurrence somewhere!`,
				footer: "but frankly, I'd rather you didn't",
				color: "#ff3864"
			});

			// Let the user know an error occurred
			embed_fatalError
				.reply(args.message, { components: aR_supportServer, allowedMentions: { repliedUser: false } })
				.catch(() => null);

			// Log the error
			return logger.error(
				"Could not execute command",
				`PRFX_CMD: ${prefix}${commandName} | guildID: ${args.message.guild.id} | userID: ${args.message.author.id}`,
				err
			);
		}
	}
};
