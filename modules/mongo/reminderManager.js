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

async function add(userID, guildID, channelID, name, repeat, repeat_count, timestamp) {
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
		repeat,
		repeat_count,
		timestamp
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

module.exports = { exists, count, fetch, fetchAll, add, delete: del };
