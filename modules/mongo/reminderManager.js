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
 * @property {number|null} sync_type
 * @property {string|null} sync_bot_id
 * @property {string|null} sync_command_name
 * @property {string[]} sync_message_content
 * @property {Boolean} sync_message_content_includes_name
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

const SyncType = {
	SLASH_COMMAND: 1,
	PREFIX_COMMAND: 2
};

/* - - - - - { Classes } - - - - - */
class Reminder {
	/** @param {ReminderData} data */
	constructor(data) {
		this._id = data._id;

		this.user_id = data.user_id;
		this.guild_id = data.guild_id;
		this.channel_id = data?.channel_id || null;

		this.enabled = data?.enabled === null ? true : data.enabled;

		this.name = data.name;
		this.repeat = data?.limit ? true : data?.repeat || false;
		this.limit = data?.limit || null;
		this.timestamp = jt.parseTime(data.raw_time, { fromNow: true });
		this.raw_time = data.raw_time;

		this.sync_type = data?.sync_type || null;
		this.sync_bot_id = data?.sync_bot_id || null;
		this.sync_command_name = data?.sync_command_name || null;
		this.sync_message_content = data?.sync_message_content || null;
		this.sync_message_content_includes_name = data?.sync_message_content_includes_name || false;

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
async function reminder_exists(id, user_id) {
	return await models.reminder.exists({ _id: id, user_id });
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
	let pipeline = [{ $match: { $and: [{ guild_id }, { enabled: true }, { timestamp: { $lte: Date.now() } }] } }];
	return (await models.reminder.aggregate(pipeline)) || [];
}

async function reminder_fetchAllAssistedInGuild(user_id, guild_id, assist_command_name) {
	return await models.reminder.find({ user_id, guild_id, assist_command_name }).lean();
}

async function reminder_edit(id, query) {
	await models.reminder.findByIdAndUpdate(id, query);
}

async function reminder_toggle(id, enabled) {
	id = jt.isArray(id);

	await Promise.all(
		id.map(async id => {
			// Fetch the reminder
			let reminder = await reminder_fetch(id);

			// Check if the timestamp is past due
			if (reminder.timestamp <= Date.now()) reminder.timestamp = jt.parseTime(reminder.raw_time, { fromNow: true });

			// prettier-ignore
			// Update the reminder
			if (enabled !== null)
				return await reminder_edit(reminder._id, { timestamp: reminder.timestamp, enabled });
			else
				return await reminder_edit(reminder._id, [{ $set: { timestamp: reminder.timestamp, enabled: { $not: "$enabled" } } }]);
		})
	);
}

async function reminder_toggleAll(user_id, guild_id, enabled) {
	// Fetch all reminders
	let reminders = await reminder_fetchAll(user_id, guild_id);

	await Promise.all(
		reminders.map(async reminder => {
			// Check if the timestamp is past due
			if (reminder.timestamp <= Date.now()) reminder.timestamp = jt.parseTime(reminder.raw_time, { fromNow: true });

			// prettier-ignore
			// Update the reminder
			if (enabled !== null)
				return await reminder_edit(reminder._id, { timestamp: reminder.timestamp, enabled });
			else
				return await reminder_edit(reminder._id, [{ $set: { timestamp: reminder.timestamp, enabled: { $not: "$enabled" } } }]);
		})
	);
}

/** @param {ReminderData} data */
async function reminder_add(data) {
	const createUniqueID = async () => {
		let id = jt.numericString(7);
		if (await reminder_exists(id, data.user_id)) return await createUniqueID();
		return id;
	};

	// Create a new reminder object
	let reminder = new Reminder({ _id: await createUniqueID(), ...data });

	// Create a new document
	let doc = new models.reminder(reminder);

	// Save the document to the database
	await doc.save().catch(err => console.error("Failed to save reminder", err));

	return reminder;
}

/** @param {ReminderTriggerData} reminderTriggerData */
async function reminder_addFromTrigger(reminderTriggerData) {
	return await reminder_add(reminderTriggerData.reminder_data);
}

async function reminder_delete(ids) {
	ids = jt.isArray(ids);

	// Delete the documents
	await models.reminder
		.deleteMany({ _id: { $in: ids } })
		.catch(err => logger.error("Could not delete reminder(s)", `id(s): '${ids.join(", ")}'`, err));
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
async function trigger_exists(id, user_id) {
	return await models.reminderTrigger.exists({ _id: id, user_id });
}

async function trigger_count(user_id, guild_id) {
	return (await models.reminderTrigger.count({ user_id, guild_id })) || 0;
}

async function trigger_fetch(id) {
	return await models.reminderTrigger.findById(id).lean();
}

async function trigger_fetchAll(user_id, guild_id) {
	return await models.reminderTrigger.find({ user_id, guild_id }).lean();
}

async function trigger_fetchForUserInGuild(user_id, guild_id) {
	return await models.reminderTrigger.findById({ user_id, guild_id }).lean();
}

/** @param {ReminderTriggerData} data */
async function trigger_add(data) {
	const createUniqueID = async () => {
		let id = jt.numericString(7);
		if (await trigger_exists(id, data.user_id)) return await createUniqueID();
		return id;
	};

	// Create a new reminder object
	let reminderTrigger = new ReminderTrigger({ _id: await createUniqueID(), ...data });

	// Create a new document
	let doc = new models.reminderTrigger(reminderTrigger);

	// Save the document to the database
	await doc.save().catch(err => console.error("Failed to save reminder trigger", err));

	return reminderTrigger;
}

async function trigger_delete(ids) {
	ids = jt.isArray(ids);

	// Delete the documents
	await models.reminder
		.deleteMany({ _id: { $in: ids } })
		.catch(err => logger.error("Could not delete reminder trigger(s)", `id(s): '${ids.join(", ")}'`, err));
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
	SyncType,

	exists: reminder_exists,
	count: reminder_count,

	fetch: reminder_fetch,
	fetchAll: reminder_fetchAll,
	fetchAllActiveInGuild: reminder_fetchAllActiveInGuild,
	fetchAllAssistedInGuild: reminder_fetchAllAssistedInGuild,

	edit: reminder_edit,
	toggle: reminder_toggle,
	toggleAll: reminder_toggleAll,

	add: reminder_add,
	addFromTrigger: reminder_addFromTrigger,
	delete: reminder_delete,
	deleteAll: reminder_deleteAll,

	trigger: {
		exists: trigger_exists,
		count: trigger_count,

		fetch: trigger_fetch,
		fetchAll: trigger_fetchAll,
		fetchForUserInGuild: trigger_fetchForUserInGuild,

		add: trigger_add,
		delete: trigger_delete,
		deleteAll: trigger_deleteAll
	}
};
