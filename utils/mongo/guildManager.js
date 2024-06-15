const models = { guild: require("../../models/guildModel").model };

/** @param {string} guild_id */
async function _exists(guild_id) {
	return (await models.guild.exists({ _id: guild_id })) ? true : false;
}

/** @param {string} guild_id */
async function _insert(guild_id) {
	if (await _exists(guild_id)) return;

	let doc = new models.guild({ _id: guild_id });
	return await doc.save();
}

/** @param {string} guild_id @param {{}} query @param {boolean} upsert */
async function _fetch(guild_id, query = {}, upsert = false) {
	if (!(await _exists(guild_id)) && upsert) return await _insert(guild_id);

	return (await models.guild.findById(guild_id, query).lean()) || null;
}

/** @param {string} guild_id @param {{}} query @param {boolean} upsert */
async function _update(guild_id, query, upsert = false) {
	return await models.guild.findByIdAndUpdate(guild_id, query), { upsert };
}

/* - - - - - { Functions } - - - - - */

/** @param {string} guild_id */
async function fetchPrefix(guild_id) {
	return (await _fetch(guild_id, { prefix: 1 }, true)).prefix || null;
}

/** @param {string} guild_id @param {string} prefix */
async function setPrefix(guild_id, prefix) {
	await _update(guild_id, { prefix }, true);
}

/** @param {string} guild_id @param {string} user_id */
async function user_warns_fetchAll(guild_id, user_id) {
	// Create the pipeline
	let pipeline = [
		{ $unwind: "$user_warns.cases" },
		{ $match: { _id: guild_id, "user_warns.cases.user_id": user_id } },
		{ $group: { _id: "$_id", warns: { $push: "$user_warns.cases" } } }
	];

	// Aggregate the document
	let res = (await models.guild.aggregate(pipeline))[0];
	if (!res?.warns?.length) return [];

	// Return the user's warns
	return res.warns;
}

/** @param {string} guild_id @param {string} user_id @param {string} warn_id */
async function user_warns_fetchOne(guild_id, user_id, warn_id) {
	// Create the pipeline
	let pipeline = [
		{ $unwind: "$user_warns.cases" },
		{ $match: { _id: guild_id, "user_warns.cases.user_id": user_id, "user_warns.cases.id": warn_id } },
		{ $group: { _id: "$_id", warns: { $push: "$user_warns.cases" } } }
	];

	// Aggregate the document
	let res = (await models.guild.aggregate(pipeline))[0];
	if (!res?.warns?.length) return null;

	// Return the user's warns
	return res.warns[0];
}

/** @param {string} guild_id @param {string} user_id @param {string} reason */
async function user_warns_add(guild_id, user_id, reason = "N/A", severity) {
	// Fetch the warns for the given user, if any
	let user_warns = await user_warns_fetchAll(guild_id, user_id);
	let warn_id = `${(user_warns?.length || 0) + 1}`;

	let data = {
		$push: { "user_warns.cases": { id: warn_id, user_id, reason, severity, timestamp: Date.now() } },
		$inc: { "user_warns.lifetime_count": 1 }
	};

	// Update the document
	await _update(guild_id, data, true);
	return data.$push["user_warns.cases"];
}

/** @param {string} guild_id @param {string} user_id @param {string} warn_id */
async function user_warns_delete(guild_id, user_id, warn_id) {
	await _update(guild_id, { $pull: { "user_warns.cases": { user_id, warn_id } } }, true);
}

module.exports = {
	_exists,
	_fetch,
	_update,
	_insert,

	fetchPrefix,
	setPrefix,

	user: {
		warns: {
			fetchAll: user_warns_fetchAll,
			fetchOne: user_warns_fetchOne,
			add: user_warns_add,
			delete: user_warns_delete
		}
	}
};
