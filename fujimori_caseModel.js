const { Schema, model } = require("mongoose");

const schema_case = new Schema(
	{
		_id: { type: String, require: true },

		requester_user_id: { type: String, require: true },
		ticket_guild_id: { type: String, require: true },
		ticket_channel_id: { type: String, require: true },

		staff_replied: { type: Boolean, default: false },
		message_history: { type: Array, default: [] },

		timestamp_created: { type: Number, default: Date.now() }
	},
	{ collection: "cases" }
);

module.exports = {
	schema: schema_case,
	model: model("cases", schema_case)
};
