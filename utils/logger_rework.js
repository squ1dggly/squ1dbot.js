/** @file Reusable functions for printing out console.log() in 4k ultra HD full color */

const chalk = require("chalk");

const { name: PROJECT } = require("../package.json");

/* - - - - - { Shorthand } - - - - - */
const _timestamp = () => chalk.bold(`[${new Date().toLocaleTimeString()}]`);

const _client = () => chalk.bold.gray("[CLIENT]");

// prettier-ignore
const _dynamic_shard = (shards = []) => `${shards?.length ? chalk.gray(`(${shards.length === 1 ? "shard:" : "shard:"} ${shards.join(", ")})`) : ""}`;
const _shard_count = count => `${count ? chalk.gray(`shards running: ${count}`) : ""}`;

// prettier-ignore
module.exports = {
	client: {
		initalizing: (shards = []) => console.log(`${_timestamp()} ${_client()} ${chalk`{red 🕒} {italic Initalizing...} ${_dynamic_shard(shards)}`}`),
		ready: (shards = []) => console.log(`${_timestamp()} ${_client()} ${chalk`{green ✔️} {italic Successfuly connected to Discord!} ${_dynamic_shard(shards)}`}`),
		online: (shardCount = 0) => console.log(`${_timestamp()} 🎉 ${chalk.blueBright(`${PROJECT}`)} is up and running! ${_shard_count(shardCount)}`)
	},

	shard: {
		init: msg => console.log(``)
	},

	success: msg => console.log(chalk.green(msg)),
	error: (header, msg, err = "") => console.error(chalk.black.bgRed(header) + " " + chalk.magenta(msg), err),

	log: msg => console.log(chalk.gray(msg)),
	debug: msg => console.log(chalk.magenta(msg))
};
