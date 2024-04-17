/** @file Import slash commands from `./slash_commands` */

const { Client } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");

function importCommands(path, recursive = false) {
	let dirEntries = jt.readDir(path, { recursive });
	let commands = [];
	let commands_userInstall = [];

	for (let entry of dirEntries) {
		let _path = `../.${path}/${entry}`;

		// prettier-ignore
		if (entry.endsWith("SLSH.js")) try {
            commands.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command", `at: \'${_path}\'`, err);
			}

		// prettier-ignore
		if (entry.endsWith("SLSH_UI.js")) try {
            commands_userInstall.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command (USER_INSTALL)", `at: \'${_path}\'`, err);
        }
	}

	return { commands, commands_userInstall };
}

/** @param {Client} client */
module.exports = client => {
	const directoryPath = "./slash_commands";
	let { commands, commands_userInstall } = importCommands(directoryPath, true);

	// prettier-ignore
	for (let command of commands)
		client.slashCommands.set(command.builder.name, command);

	// prettier-ignore
	for (let command of commands_userInstall)
		client.slashCommands_userInstall.set(command.data.name, command);
};
