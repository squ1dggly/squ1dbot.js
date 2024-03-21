/** @typedef {"DAILY" | "WORK"} ReminderType */

const jt = require("../jsTools");

const config = { cooldowns: require("../../config/config_cooldowns.json") };

const models = { reminder: require("../../models/reminderModel").model };

/* - - - - - { Schema } - - - - - */
async function _count() {
	return await models.reminder.count();
}

/** @param {string} id */
async function _exists(id) {
	return (await models.reminder.exists({ _id: id })) ? true : false;
}

/** @param {string} id @param {{}} query */
async function _insert(id, query) {
	if (await _exists(id)) return;

	let doc = new models.reminder({ _id: id, ...query });
	await doc.save();

	return doc;
}

/** @param {string} id @param {{}} query @param {{upsert:boolean}} options */
async function _fetch(id, query = {}, options) {
	options = { upsert: true, ...options };

	if (!(await _exists(id)) && options.upsert) return await _insert(id);

	let userData = (await models.reminder.findById(id, query || {}).lean()) || null;
	return userData;
}

/** @param {string | {}} filter ID or filter @param {{}} query @param {boolean} upsert */
async function _update(filter, query, upsert = false) {
	if (typeof filter === "object") return await models.reminder.updateOne(filter, query, { upsert });
	else return await models.reminder.findByIdAndUpdate(filter, query, { upsert });
}

/* - - - - - { Utilites } - - - - - */
/** @param {string} user_id @param {ReminderType} type */
async function fetchOneByUserAndType(user_id, type) {
	return await _fetch({ user_id, type });
}

/** @param {string} guild_id */
async function fetchAllActiveInGuild(guild_id) {
	let pipeline = [{ $match: { $and: [{ guild_id }, { enabled: true }, { timestamp: { $lte: Date.now() } }] } }];
	return (await models.reminder.aggregate(pipeline)) || [];
}

/** @param {string} user_id @param {string} guild_id @param {string} channel_id @param {ReminderType} type */
async function set(user_id, guild_id, channel_id, type) {
	let cooldownData = config.cooldowns[type];
	if (!cooldownData) return;

	const createUniqueID = async () => {
		let id = jt.numericString(7);
		if (await _exists(id)) return await createUniqueID();
		return id;
	};

	// Fetch an existing reminder, if it exists
	let reminder = await _fetch({ type, user_id });

	// Update existing reminder data
	if (reminder?.user_id === user_id && reminder?.type === type)
		reminder = {
			...reminder,
			guild_id,
			channel_id,
			timestamp: jt.parseTime(cooldownData)
		};
	// New reminder data
	else
		reminder = {
			_id: await createUniqueID(),
			type,
			user_id,
			guild_id,
			channel_id,
			timestamp: jt.parseTime(cooldownData)
		};

	// Create and save the reminder to the database
	await _insert(reminder._id, reminder);

	return reminder;
}

/** @param {string} id */
async function remove(id) {
	return await models.reminder.deleteOne({ _id: id });
}

/** @param {string} id @param {"DM" | "CHANNEL" | null} id */
async function setMode(id, mode = null) {
	let reminderMode = await _fetch(id, { mode });
	if (!reminderMode) return null;

	if (!mode)
		if (reminderMode.mode === "DM") reminderMode.mode = "CHANNEL";
		else reminderMode.mode = "DM";
	else reminderMode.mode = mode;

	await _update(id, { mode: reminderMode.mode });

	return reminderMode.mode;
}

module.exports = {
	_count,
	_exists,
	_insert,
	_fetch,
	_update,

	fetchOneByUserAndType,
	fetchAllActiveInGuild,
	set,
	remove,
	setMode
};
