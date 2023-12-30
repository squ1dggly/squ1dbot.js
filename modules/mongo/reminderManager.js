const { Message } = require("discord.js");
const jt = require("../jsTools");

const models = {
	reminder: require("../../models/reminderModel").model,
	reminderTrigger: require("../../models/reminderTriggerModel").model
};

/* - - - - - { Reminder } - - - - - */
async function reminder_exists(id) {
	return await models.reminder.exists({ _id: id });
}

async function reminder_count(user_id, guild_id) {
	return (await models.reminder.count({ user_id, guild_id })) || 0;
}

async function reminder_fetch(id) {
	return await models.reminder.findById(id).lean();
}

async function reminder_fetchAll(user_id, guild_id) {
	return await models.reminder.find({ user_id, guild_id }).lean();
}

async function reminder_fetchAllActiveInGuild(guild_id) {
	let pipeline = [{ $match: { $and: [{ guild_id }, { timestamp: { $lte: Date.now() } }] } }];
	return (await models.reminder.aggregate(pipeline)) || [];
}

async function reminder_fetchAllAssistedInGuild(user_id, guild_id, assist_command_name) {
	return await models.reminder.find({ user_id, guild_id, assist_command_name }).lean();
}

async function reminder_update(id, query) {
	await models.reminder.findByIdAndUpdate(id, query);
}

async function reminder_add(user_id, guild_id, channel_id, name, repeat, limit, time, assistMessage = null) {
	const createUniqueID = async () => {
		let id = jt.numericString(7);
		if (await reminder_exists(id)) return await createUniqueID();
		return id;
	};

	// Create the data object for the new reminder
	let reminderData = {
		_id: await createUniqueID(),
		user_id,
		guild_id,
		channel_id,
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

async function reminder_del(id) {
	if (!(await reminder_exists(id))) return console.log(`Can not delete non-existent reminder '${id}'`);
	await models.reminder.findByIdAndDelete(id).catch(err => console.error("Failed to delete reminder", err));
}

async function reminder_delAll(user_id, guild_id) {
	await models.reminder.deleteMany({ user_id: user_id, guild_id: guild_id });
}

/* - - - - - { Reminder Trigger } - - - - - */
async function trigger_exists(id) {
	return await models.reminderTrigger.exists({ _id: id });
}

async function reminder_count(user_id, guild_id) {
	return (await models.reminderTrigger.count({ user_id, guild_id })) || 0;
}

async function trigger_fetch(id) {
	return await models.reminderTrigger.findById(id).lean();
}

async function trigger_fetchInGuild(user_id, guild_id) {
	
}

module.exports = {
	exists: reminder_exists,
	count: reminder_count,
	fetch: reminder_fetch,
	fetchAll: reminder_fetchAll,
	fetchAllActiveInGuild: reminder_fetchAllActiveInGuild,
	fetchAllAssistedInGuild: reminder_fetchAllAssistedInGuild,
	update: reminder_update,
	add: reminder_add,
	delete: reminder_del,
	deleteAll: reminder_delAll,

	trigger: {
		exists: trigger_exists,
		fetch: trigger_fetch
	}
};
