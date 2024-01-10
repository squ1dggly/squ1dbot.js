/** @typedef extra
 * @property {string} cleanContent message content without the command name
 * @property {string} cmdName command name
 * @property {string} prefix prefix used */

const { Client, Message } = require("discord.js");

const { BetterEmbed, EmbedNavigator } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

module.exports = {
	name: "help",
	description: "View a list of my commands",

	/** @param {Client} client @param {Message} message @param {extra} extra */
	execute: async (client, message, { prefix }) => {
		// Get the current prefix commands and filter out ones that are set to be hidden
		let commands = [...client.prefixCommands.values()].filter(cmd => !cmd?.options?.hidden);

		// Check if there's available commands
		if (!commands.length) return await new BetterEmbed({ title: "There aren't any commands available." }).reply(message);

		// Get the available categories
		let command_categories = jt.unique(
			commands.map(cmd => ({ name: cmd.category, icon: cmd.categoryIcon || null })),
			"name"
		);

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
			commands_f.push({ str: _f, name: cmd.name, category: cmd.category || null });
		}

		// Create an array to store each group of embeds for each command category
		let embeds_categories = [];

		// Iterate through the command categories and create the appropriate command pages
		for (let category of command_categories) {
			// Get all the commands for the current category
			let _cmds = commands_f.filter(cmd => cmd.category === category.name);

			// Make it a max of 10 command per page
			let _cmds_split = jt.chunk(_cmds, 10);

			// Create an array to store each "page" for the current category
			let _embeds = [];

			// Create an embed for each page
			for (let i = 0; i < _cmds_split.length; i++) {
				let group = _cmds_split[i];

				// Create the embed :: { COMMANDS (PAGE) }
				let _embed = new BetterEmbed({
					title: "Help",
					description: group.join("\n"),
					footer: `Page ${i + 1} of ${_cmds_split.length}`
				});

				// Push the embed to the array
				_embeds.push(_embed);
			}

			// Push the embed array to the main command category array
			if (_embeds.length) embeds_categories.push(_embeds);
		}

		// Setup page navigation
		let embedNav = new EmbedNavigator({
			channel: message.channel,
			embeds: embeds_categories,
			pagination: { type: "short", dynamic: false },
			selectMenuEnabled: true
		});

		// Configure select menu options
		embedNav.addSelectMenuOptions(command_categories.map(cat => ({ emoji: cat.icon, label: cat.name })));

		// Send the navigator
		return await embedNav.send();
	}
};
