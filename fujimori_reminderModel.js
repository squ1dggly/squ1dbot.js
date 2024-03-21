const { Schema, model } = require("mongoose");

const schema_reminder = new Schema(
	{
		_id: { type: String, require: true },
		
		type: { type: String, require: true },
		user_id: { type: String, require: false },
		guild_id: { type: String, require: false },
		channel_id: { type: String, require: false },

		mode: { type: String, default: "DM" },

		enabled: { type: Boolean, default: true },

		timestamp: { type: Number, require: true }
	},
	{ collection: "reminders" }
);

module.exports = {
	schema: schema_reminder,
	model: model("reminders", schema_reminder)
};
