/** @typedef ReminderData
 * @property {string} _id
 *
 * @property {string} user_id
 * @property {string} guild_id
 * @property {string|null} channel_id
 *
 * @property {boolean} enabled
 *
 * @property {string} name
 * @property {boolean} repeat
 * @property {number|null} limit
 * @property {number} timestamp
 * @property {string} raw_time
 *
 * @property {number|null} assist_type
 * @property {string|null} assist_bot_id
 * @property {string|null} assist_command_name
 * @property {string[]} assist_message_content
 * @property {Boolean} assist_message_content_includes_name
 *
 * @property {number} created */

/** @typedef ReminderTriggerData
 * @property {string} user_id
 * @property {string} guild_id
 * @property {string} message_trigger
 * @property {Reminder} reminder_data */

const logger = require("../logger");
const jt = require("../jsTools");

const models = {
	reminder: require("../../models/reminderModel").model,
	reminderTrigger: require("../../models/reminderTriggerModel").model
};

/* - - - - - { Classes } - - - - - */
class Reminder {
	/** @param {ReminderData} data */
	constructor(data) {
		this._id = data._id;

		this.user_id = data.user_id;
		this.guild_id = data.guild_id;
		this.channel_id = data?.channel_id || null;

		this.name = data.name;
		this.repeat = data?.limit ? true : data?.repeat || false;
		this.limit = data?.limit || null;
		this.timestamp = jt.parseTime(data.raw_time, { fromNow: true });
		this.raw_time = data.raw_time;

		this.assist_type = data?.assist_type || null;
		this.assist_bot_id = data?.assist_bot_id || null;
		this.assist_message_content = data?.assist_message_content || null;
		this.assist_message_content_includes_name = data?.assist_message_content_includes_name || false;

		return { ...this };
	}
}

class ReminderTrigger {
	/** @param {ReminderTriggerData} data */
	constructor(data) {
		this._id = data._id;

		this.user_id = data.user_id;
		this.guild_id = data.guild_id;

		this.message_trigger = data.message_trigger;

		this.reminder_data = data.reminder_data;

		return { ...this };
	}
}

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

/** @param {ReminderData} data */
async function reminder_add(data) {
	const createUniqueID = async () => {
		let id = jt.numericString(7);
		if (await reminder_exists(id)) return await createUniqueID();
		return id;
	};

	// Create a new reminder object
	let reminder = new Reminder(data);

	// Create a new document
	let doc = new models.reminderTrigger(reminder);

	// Save the document to the database
	await doc.save().catch(err => console.error("Failed to save reminder", err));

	return reminder;
}

/** @param {ReminderTriggerData} reminderTriggerData */
async function reminder_addFromTrigger(reminderTriggerData) {
	return await reminder_add(reminderTriggerData.reminder_data);
}

async function reminder_delete(id) {
	// Check if the document exists
	if (!(await reminder_exists(id))) return logger.log(`Could not delete non-existent reminder '${id}'`);

	// Delete the document
	await models.reminder.findByIdAndDelete(id).catch(err => logger.error("Could not delete reminder", `id: '${id}'`, err));
}

async function reminder_deleteAll(user_id, guild_id) {
	// prettier-ignore
	// Delete all documents that include both the user and guild's ID
	if (guild_id) await models.reminder
		.deleteMany({ user_id, guild_id })
		.catch(err => logger.error(`Could not delete reminders`, `user_id: '${user_id}' | guild_id: '${guild_id}'`, err));
	// Delete all documents that include the user's ID
	else await models.reminder
		.deleteMany({ user_id })
		.catch(err => logger.error("Could not delete reminders", `user_id: '${user_id}'`, err));
}

/* - - - - - { Reminder Trigger } - - - - - */
async function trigger_exists(id) {
	return await models.reminderTrigger.exists({ _id: id });
}

async function trigger_count(user_id, guild_id) {
	return (await models.reminderTrigger.count({ user_id, guild_id })) || 0;
}

async function trigger_fetch(id) {
	return await models.reminderTrigger.findById(id).lean();
}

async function trigger_fetchForUserInGuild(user_id, guild_id) {
	return await models.reminderTrigger.findById({ user_id, guild_id }).lean();
}

/** @param {ReminderTriggerData} data */
async function trigger_add(data) {
	const createUniqueID = async () => {
		let id = jt.numericString(7);
		if (await trigger_exists(id)) return await createUniqueID();
		return id;
	};

	// Create a new reminder object
	let reminderTrigger = new ReminderTrigger(data);

	// Create a new document
	let doc = new models.reminderTrigger(reminderTrigger);

	// Save the document to the database
	await doc.save().catch(err => console.error("Failed to save reminder trigger", err));

	return reminderTrigger;
}

async function trigger_delete(id) {
	// Check if the document exists
	if (!(await trigger_exists(id))) return logger.log(`Could not delete non-existent reminder trigger '${id}'`);

	// Delete the document
	await models.reminderTrigger
		.findByIdAndDelete(id)
		.catch(err => logger.error("Could not delete reminder trigger", `id: '${id}'`, err));
}

async function trigger_deleteAll(user_id, guild_id = null) {
	// prettier-ignore
	// Delete all documents that include both the user and guild's ID
	if (guild_id) await models.reminderTrigger
		.deleteMany({ user_id, guild_id })
		.catch(err => logger.error(`Could not delete reminder triggers`, `user_id: '${user_id}' | guild_id: '${guild_id}'`, err));
	// Delete all documents that include the user's ID
	else await models.reminderTrigger
		.deleteMany({ user_id })
		.catch(err => logger.error("Could not delete reminder triggers", `user_id: '${user_id}'`, err));
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
	addFromTrigger: reminder_addFromTrigger,
	delete: reminder_delete,
	deleteAll: reminder_deleteAll,

	trigger: {
		exists: trigger_exists,
		count: trigger_count,
		fetch: trigger_fetch,
		fetchForUserInGuild: trigger_fetchForUserInGuild,
		add: trigger_add,
		delete: trigger_delete,
		deleteAll: trigger_deleteAll
	}
};
