const { Schema, model } = require("mongoose");

const schema_user = new Schema(
	{
		_id: { type: String, require: true },

		biography: { type: String, default: "" },

		custom_replies_found: { type: Array, default: [] },

		timestamp_started: { type: Number, default: Date.now() }
	},
	{ collection: "users" }
);

module.exports = {
	schema: schema_user,
	model: model("users", schema_user)
};
