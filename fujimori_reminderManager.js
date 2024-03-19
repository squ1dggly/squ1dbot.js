/** @typedef ReminderData
 * @property {string} _id
*
 * @property {string} type
 * @property {string} user_id
 * @property {string} guild_id
 *
 * @property {boolean} enabled
 *
 * @property {string} name
 * @property {number} timestamp */

const logger = require("../logger");
const jt = require("../jsTools");

const models = {
	reminder: require("../../models/reminderModel").model
};

/* - - - - - { Classes } - - - - - */
class Reminder {
	/** @param {ReminderData} data */
	constructor(data) {
		this._id = data._id;
		
		this.type = data.type;
		this.user_id = data.user_id;
		this.guild_id = data.guild_id;

		this.enabled = data?.enabled === null ? true : data.enabled;

		this.name = data.name;
		this.timestamp = jt.parseTime(data.timestamp, { fromNow: true });

		return { ...this };
	}
}

/* - - - - - { Reminder } - - - - - */
async function reminder_exists(id, user_id) {
	return await models.reminder.exists({ _id: id, user_id }) ? true : false;
}

async function reminder_count(user_id, guild_id) {
	return (await models.reminder.count({ user_id, guild_id })) || 0;
}

/** @returns {ReminderData} */
async function reminder_fetch(id) {
	return await models.reminder.findById(id).lean();
}

/** @returns {ReminderData[]} */
async function reminder_fetchAll(id) {
	return await models.reminder.find().lean();
}

/** @returns {ReminderData} */
async function reminder_fetchForUser(user_id) {
	return await models.reminder.find({ user_id }).lean();
}

/** @returns {ReminderData} */
async function reminder_fetchForUserInGuild(user_id, guild_id) {
	return await models.reminder.find({ user_id, guild_id }).lean();
}

/** @returns {ReminderData[]} */
async function reminder_fetchActiveInGuild(guild_id) {
	let pipeline = [{ $match: { $and: [{ guild_id }, { enabled: true }, { timestamp: { $lte: Date.now() } }] } }];
	return (await models.reminder.aggregate(pipeline)) || [];
}

async function reminder_edit(id, query) {
	await models.reminder.findByIdAndUpdate(id, query);
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

module.exports = {
	SyncType,

	exists: reminder_exists,
	count: reminder_count,

	fetch: reminder_fetch,
	fetchAll: reminder_fetchAll,
	fetchForUser: reminder_fetchForUser,
	fetchForUserInGuild: reminder_fetchForUserInGuild,
	fetchActiveInGuild: reminder_fetchActiveInGuild,

	add: reminder_add,
	edit: reminder_edit,
	delete: reminder_delete,
	deleteAll: reminder_deleteAll
};
