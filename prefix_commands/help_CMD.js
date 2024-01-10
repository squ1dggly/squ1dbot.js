/** @typedef extra
 * @property {string} cleanContent message content without the command name
 * @property {string} cmdName command name
 * @property {string} prefix prefix used */

const { Client, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");

module.exports = {
	name: "help",
	description: "View a list of my commands",

	/** @param {Client} client @param {Message} message @param {extra} extra */
	execute: async (client, message, { prefix }) => {
		// Get the current prefix commands and filter out ones that are set to be hidden
		let commands = [...client.prefixCommands.values()].filter(cmd => !cmd?.options?.hidden);

		// Parse prefix commands into a readable format
		let commands_f = [];

		// Iterate through each prefix command
		for (let cmd of commands) {
			// the main line
			let _f = "- $ICON**$PREFIX$COMMAND**"
				.replace("$ICON", cmd?.options?.icon ? `${cmd.options.icon} | ` : "")
				.replace("$PREFIX", prefix)
				.replace("$COMMAND", cmd.name);

			/* - - - - - { Extra Command Options } - - - - - */
			let _extra = [];

			// prettier-ignore
			if (cmd?.options?.alias?.length)
				_extra.push(` - aliases: ${cmd.options.aliases.map(a => `**${a}**`).join(", ")}`);

			// prettier-ignore
			if (cmd?.options?.usage)
				_extra.push(` - usage: ${cmd.options.usage}`);

			// prettier-ignore
			if (cmd?.options?.description)
				_extra.push(` - *${cmd.options.description}*`);

			// Append the extra options to the main line
			if (_extra.length) _f += `\n${_extra.join("\n")}`;

			// Push the formatted command to the main array
			commands_f.push({ str: _f, category: cmd?.options?.category || null });
		}

		// Create the embed :: { HELP }
		let embed_help = new BetterEmbed({
			title: "Help",
			description: commands_f.join("\n"),
			footer: `${commands.length} commands available`
		});

		// prettier-ignore
		// Send the embed with the command list, if available
		if (embed_help_description.length) return await embed_help.reply(message, {
			description: embed_help_description.join("\n"),
            allowedMentions: { repliedUser: false }
		});

		// Send the embed with an error
		return await embed_help.reply(message, {
			description: "**There aren't any commands available**",
			allowedMentions: { repliedUser: false }
		});
	}
};
