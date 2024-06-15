const models = { user: require("../../models/userModel").model };

/** @param {string} user_id */
async function _exists(user_id) {
	return (await models.user.exists({ _id: user_id })) ? true : false;
}

/** @param {string} user_id */
async function _insert(user_id) {
	if (await _exists(user_id)) return;

	let doc = new models.user({ _id: user_id });
	return await doc.save();
}

/** @param {string} user_id @param {{}} query @param {boolean} upsert */
async function _fetch(user_id, query = {}, upsert = false) {
	if (!(await _exists(user_id)) && upsert) return await _insert(user_id);

	return (await models.user.findById(user_id, query).lean()) || null;
}

/** @param {string} user_id @param {{}} query @param {boolean} upsert */
async function _update(user_id, query, upsert = false) {
	return await models.user.findByIdAndUpdate(user_id, query, { upsert });
}

module.exports = {
	_exists,
	_insert,
	_fetch,
	_update
};
