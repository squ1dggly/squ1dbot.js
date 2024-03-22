// const jt = require("../jsTools");
const jt = require("./utils/jsTools");

const models = { case: require("../../models/caseModel").model };

/* - - - - - { Schema } - - - - - */
async function _count() {
	return await models.case.count();
}

/** @param {string} id */
async function _exists(id) {
	return (await models.case.exists({ _id: id })) ? true : false;
}

/** @param {string} id @param {{}} query */
async function _insert(id, query) {
	if (await _exists(id)) return;

	let doc = new models.case({ _id: id, ...query });
	await doc.save();

	return doc;
}

/** @param {string} id @param {{}} query @param {{upsert:boolean}} options */
async function _fetch(id, query = {}, options) {
	options = { upsert: false, ...options };

	if (!(await _exists(id)) && options.upsert) return await _insert(id);

	let userData = (await models.case.findById(id, query || {}).lean()) || null;
	return userData;
}

/** @param {string | {}} filter ID or filter @param {{}} query @param {boolean} upsert */
async function _update(filter, query, upsert = false) {
	if (typeof filter === "object") return await models.case.updateOne(filter, query, { upsert });
	else return await models.case.findByIdAndUpdate(filter, query, { upsert });
}

/* - - - - - { Utilites } - - - - - */
async function create(requester_user_id, ticket_guild_id, ticket_channel_id) {
	const createUniqueID = async () => {
		// format: 123-456-789
		let id = jt
			.alphaNumericString(9)
			.match(/.{1,3}/g)
			.join("-");
		if (await _exists(id)) return await createUniqueID();
		return id;
	};

	// Insert a new case into the database
	await _insert(await createUniqueID(), { requester_user_id, ticket_guild_id, ticket_channel_id });
}

async function remove(id) {
	return await models.case.deleteOne({ _id: id });
}

async function saveReply(id, message) {
	if (!(await _exists(id))) throw new Error(`'${id}' is not an existing case ID`);

	let replyData = {
		id: message.id,
		user_id: message.author.id,
		content: message.content,
		timestamp: message.createdTimestamp
	};

	return await _update(id, { $push: { message_history: replyData } });
}

async function saveStaffReply(id, message) {
	if (!(await _exists(id))) throw new Error(`'${id}' is not an existing case ID`);

	let replyData = {
		id: message.id,
		user_id: message.author.id,
		content: message.content,
		is_staff: true,
		timestamp: message.createdTimestamp
	};

	return await _update(id, { $push: { message_history: replyData } });
}

module.exports = {
	_count,
	_exists,
	_insert,
	_fetch,
    _update,
    
    create,
    remove,
    saveReply,
    saveStaffReply
};
