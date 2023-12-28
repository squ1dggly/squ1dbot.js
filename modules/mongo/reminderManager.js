const { Message } = require("discord.js");
const jt = require("../jsTools");

const models = { reminder: require("../../models/reminderModel").model };

async function exists(id) {
	return await models.reminder.exists({ _id: id });
}

async function count(userID, guildID) {
	return (await models.reminder.count({ user_id: userID, guild_id: guildID })) || 0;
}

async function fetch(id) {
	return await models.reminder.findById(id).lean();
}

async function fetchAll(userID, guildID) {
	return await models.reminder.find({ user_id: userID, guild_id: guildID }).lean();
}

async function fetchAllActiveInGuild(guildID) {
	let pipeline = [{ $match: { $and: [{ guild_id: guildID }, { timestamp: { $lte: Date.now() } }] } }];
	return (await models.reminder.aggregate(pipeline)) || [];
}

async function fetchAllAssistedInGuild(userID, guildID, commandName) {
	return await models.reminder.find({ user_id: userID, guild_id: guildID, assisted_command_name: commandName }).lean();
}

async function update(id, query) {
	await models.reminder.findByIdAndUpdate(id, query);
}

async function add(userID, guildID, channelID, name, repeat, limit, time, assistMessage = null) {
	const createUniqueID = async () => {
		let id = jt.numericString(7);
		if (await exists(id)) return await createUniqueID();
		return id;
	};

	// Create the data object for the new reminder
	let reminderData = {
		_id: await createUniqueID(),
		user_id: userID,
		guild_id: guildID,
		channel_id: channelID,
		name,
		repeat: limit ? true : repeat,
		limit: limit || null,
		timestamp: jt.parseTime(time, { fromNow: true }),
		time,
		assisted_command_bot_id: assistMessage?.author?.id || null,
		assisted_command_name: assistMessage?.interaction?.commandName || null
	};

	/* - - - - - { Add the Reminder to the Database } - - - - - */
	let doc = new models.reminder(reminderData);
	await doc.save().catch(err => console.error("Failed to save reminder", err));

	// Return the reminder data object
	return reminderData;
}

async function del(id) {
	if (!(await exists(id))) return console.log(`Can not delete non-existent reminder '${id}'`);
	await models.reminder.findByIdAndDelete(id).catch(err => console.error("Failed to delete reminder", err));
}

async function delAll(userID, guildID) {
	await models.reminder.deleteMany({ user_id: userID, guild_id: guildID });
}

module.exports = {
	exists,
	count,
	fetch,
	fetchAll,
	fetchAllActiveInGuild,
	fetchAllAssistedInGuild,
	update,
	add,
	delete: del,
	deleteAll: delAll
};
