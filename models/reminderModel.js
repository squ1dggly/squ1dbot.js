const { Schema, model } = require("mongoose");

const schema_reminder = new Schema(
	{
		_id: { type: String, require: true },

		user_id: { type: String, require: true },
		guild_id: { type: String, require: true },
		channel_id: { type: String, require: true },

		name: { type: String, require: true },
		repeat: { type: Boolean, default: false },
		limit: { type: Number, default: null },
		timestamp: { type: Number, require: true },
		time: { type: String, require: true }
	},
	{ collection: "reminders" }
);

module.exports = {
	schema: schema_reminder,
	model: model("reminders", schema_reminder)
};
