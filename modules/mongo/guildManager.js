const logger = require("../logger");
const jt = require("../jsTools");

const models = {
	guild: require("../../models/guildModel").model
};

async function exists(guild_id) {
	return (await models.guild.exists({ _id: guild_id })) ? true : false;
}

async function fetch(guild_id, query = {}) {
	return (await models.guild.findById(guild_id).lean()) || null;
}

async function insertNew(guild_id) {
	if (await exists(guild_id)) return;

	let doc = new models.guild({ _id: guild_id });
	return await doc.save();
}

async function fetchPrefix(guild_id) {}

async function setPrefix(guild_id, prefix) {}
